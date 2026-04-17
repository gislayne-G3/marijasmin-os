import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // ⏸️ AGENTS_PAUSED (auditoria de custos 2026-04-16)
  // Set AGENTS_PAUSED=false no Vercel env pra reativar geração de descrição.
  if (process.env.AGENTS_PAUSED === 'true') {
    return res.status(503).json({
      error: 'Geração de descrição pausada para auditoria de custos',
      reativar: 'Remover AGENTS_PAUSED=true no Vercel Settings → Environment Variables',
    })
  }

  const { nome, categoria, cores, tecido, detalhes } = req.body

  if (!nome || !categoria) return res.status(400).json({ error: 'nome e categoria obrigatórios' })

  const coresTexto = Array.isArray(cores) && cores.length > 0
    ? `Disponível nas cores/estampas: ${cores.join(', ')}.`
    : ''

  const tecidoTexto = tecido ? `Tecido/Material: ${tecido}.` : ''
  const detalhesTexto = detalhes ? `Detalhes extras: ${detalhes}.` : ''

  const prompt = `Você é especialista em descrições de produtos de moda feminina cristã e modesta.

Crie uma descrição profissional para o seguinte produto da marca Marijasmin:
- Nome: ${nome}
- Categoria: ${categoria}
${coresTexto}
${tecidoTexto}
${detalhesTexto}

RETORNE APENAS o HTML abaixo, sem explicações, sem markdown, sem \`\`\`:

<h2>${nome} – [crie uma tagline elegante de até 8 palavras]</h2>
<p>[Parágrafo principal: 3-4 frases descrevendo o produto com foco em conforto, elegância e versatilidade. Tom feminino e cristão.]</p>

<div class="secao-foto">
<h3>[Título sobre design/modelagem/caimento — ex: "Design Feminino que Valoriza a Silhueta"]</h3>
<p>[Descrição de 2-3 frases sobre o design, modelagem, caimento ou recortes do produto.]</p>
</div>

<div class="secao-foto">
<h3>[Título sobre tecido/conforto/qualidade — ex: "Tecido Premium para Máximo Conforto"]</h3>
<p>[Descrição de 2-3 frases sobre o tecido, qualidade, sensação ao vestir, respirabilidade.]</p>
</div>

<div class="secao-foto">
<h3>[Título sobre versatilidade/ocasiões/estilo — ex: "Perfeita Para Qualquer Ocasião"]</h3>
<p>[Descrição de 2-3 frases sobre as ocasiões de uso, como combinar, versatilidade do produto.]</p>
</div>

Regras:
- Tom: feminino, elegante, cristão, acolhedor
- Sem exageros ou superlativos excessivos
- Foco em conforto, elegância, praticidade e modéstia
- NÃO mencione WBuy, Nuvemshop ou nomes de plataformas
- Máximo 80 palavras por parágrafo`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const html = (response.content[0] as { type: string; text: string }).text.trim()
    res.status(200).json({ html })
  } catch (err) {
    console.error('Erro Claude API:', err)
    res.status(500).json({ error: 'Erro ao gerar descrição' })
  }
}
