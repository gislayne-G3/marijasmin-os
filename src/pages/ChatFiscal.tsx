import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Send, Bot, User, Loader2 } from 'lucide-react'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
  ts: string
}

const SUGESTOES = [
  'Qual o custo total dos agentes este mês?',
  'Quais agentes estão em produção agora?',
  'Quanto gastei com a Mari SDR hoje?',
  'Quando o Agente Financeiro vai estar ativo?',
]

export default function ChatFiscal() {
  const [msgs, setMsgs] = useState<Mensagem[]>([
    {
      role: 'assistant',
      content: 'Olá, Gislayne! Sou o Agente Fiscal do seu OS. Posso responder perguntas sobre os agentes, custos, tokens e métricas do sistema. O que quer saber?',
      ts: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function enviar(texto?: string) {
    const msg = (texto || input).trim()
    if (!msg || loading) return

    setInput('')
    const userMsg: Mensagem = { role: 'user', content: msg, ts: new Date().toISOString() }
    setMsgs(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // Buscar dados reais do Supabase para contexto
      const [r1, r2] = await Promise.all([
        supabase.from('agentes_resumo').select('*'),
        supabase.from('agentes_uso').select('agente, custo_usd, created_at').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ])

      const resumo = r1.data || []
      const hoje = r2.data || []

      const custoHojeTotal = hoje.reduce((s: number, r: { custo_usd: number }) => s + Number(r.custo_usd), 0)
      const custoMesTotal = resumo.reduce((s: number, r: { custo_mes_brl: number }) => s + Number(r.custo_mes_brl), 0)

      // Gera resposta com base nos dados reais
      const resposta = gerarResposta(msg, { resumo, custoHojeTotal, custoMesTotal })

      const botMsg: Mensagem = { role: 'assistant', content: resposta, ts: new Date().toISOString() }
      setMsgs(prev => [...prev, botMsg])
    } catch {
      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, tive um problema ao consultar os dados. Verifique se a chave do Supabase está configurada corretamente.',
        ts: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-5 border-b border-[#2a2a38] bg-[#0f0f14]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
            <Bot size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Chat Fiscal</h1>
            <p className="text-xs text-gray-500">Agente Fiscal · Dados em tempo real do Supabase</p>
          </div>
          <span className="ml-auto text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded-full">● online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${m.role === 'user' ? 'bg-purple-600' : 'bg-[#1e1e2a] border border-[#2a2a38]'}`}>
              {m.role === 'user'
                ? <User size={14} className="text-white" />
                : <Bot size={14} className="text-purple-400" />}
            </div>
            <div className={`max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-sm'
                  : 'bg-[#16161f] border border-[#2a2a38] text-gray-200 rounded-tl-sm'
              }`}>
                {m.content}
              </div>
              <p className="text-[10px] text-gray-600 px-1">
                {new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#1e1e2a] border border-[#2a2a38] flex items-center justify-center">
              <Bot size={14} className="text-purple-400" />
            </div>
            <div className="px-4 py-3 bg-[#16161f] border border-[#2a2a38] rounded-2xl rounded-tl-sm">
              <Loader2 size={14} className="text-purple-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugestões */}
      {msgs.length <= 2 && (
        <div className="px-8 pb-2 flex gap-2 flex-wrap">
          {SUGESTOES.map(s => (
            <button
              key={s}
              onClick={() => enviar(s)}
              className="text-xs bg-[#1e1e2a] border border-[#2a2a38] text-gray-400 hover:text-gray-200 hover:border-purple-500/30 px-3 py-1.5 rounded-full transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-8 py-5 border-t border-[#2a2a38]">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
            placeholder="Pergunte sobre agentes, custos, tokens..."
            className="flex-1 bg-[#16161f] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
          <button
            onClick={() => enviar()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

function gerarResposta(msg: string, dados: { resumo: Record<string, unknown>[], custoHojeTotal: number, custoMesTotal: number }) {
  const lower = msg.toLowerCase()

  if (lower.includes('custo') && (lower.includes('hoje') || lower.includes('dia'))) {
    return `Hoje você gastou **R$ ${(dados.custoHojeTotal * 5.8).toFixed(6)}** com os agentes.\n\nEm USD: $${dados.custoHojeTotal.toFixed(6)}`
  }

  if (lower.includes('custo') && lower.includes('mês')) {
    return `Custo acumulado este mês: **R$ ${dados.custoMesTotal.toFixed(4)}**\n\nIsso equivale a aproximadamente ${(dados.custoMesTotal / 30).toFixed(6)} R$/dia.`
  }

  if (lower.includes('agente') && (lower.includes('ativo') || lower.includes('produção'))) {
    return `Agentes em produção agora:\n\n💬 **Mari SDR** — Atendimento WhatsApp 24h\n📸 **OCR PIX** — Leitura de comprovantes\n🔗 **Links Pagar.me** — Geração de links de pagamento\n\nTotal: 3 agentes ativos de 14 planejados.`
  }

  if (lower.includes('mari') && lower.includes('custo')) {
    const mariResumo = dados.resumo.find((r: Record<string, unknown>) => (r.agente as string) === 'mari_sdr')
    if (mariResumo) {
      return `Custo da Mari SDR:\n• Mês atual: R$ ${Number((mariResumo as { custo_mes_brl: number }).custo_mes_brl).toFixed(4)}\n• Total histórico: R$ ${Number((mariResumo as { custo_total_brl: number }).custo_total_brl).toFixed(4)}\n• Chamadas este mês: ${Number((mariResumo as { chamadas_mes: number }).chamadas_mes).toLocaleString('pt-BR')}`
    }
    return `Ainda sem dados da Mari SDR registrados. As chamadas aparecerão aqui quando o agente começar a operar.`
  }

  if (lower.includes('financeiro') || lower.includes('quando') && lower.includes('ativo')) {
    return `O Agente Financeiro Estrategista está planejado para a **Fase 2** (semanas 4-6).\n\nEle vai:\n• Ler o DRE completo\n• Identificar vazamentos financeiros\n• Criar plano de saída de dívidas com prazo\n• Responder perguntas como esta no chat`
  }

  if (lower.includes('token')) {
    const totalTokens = dados.resumo.reduce((s: number, r: Record<string, unknown>) => s + Number(r.total_tokens || 0), 0)
    return `Total de tokens consumidos (histórico): **${totalTokens.toLocaleString('pt-BR')}**\n\nOs tokens são divididos entre input (contexto enviado) e output (resposta gerada). O custo do Haiku é $0,80/M input e $4,00/M output.`
  }

  if (lower.includes('resumo') || lower.includes('visão geral') || lower.includes('status')) {
    return `Resumo do ecossistema Marijasmim OS:\n\n📊 **Custo mês atual:** R$ ${dados.custoMesTotal.toFixed(4)}\n🤖 **Agentes ativos:** 3 de 14\n💡 **Fase atual:** Fase 1 — CRM Comercial\n\n**Próximas fases:**\n• Fase 2: Financeiro (semanas 4-6)\n• Fase 3: Marketing completo\n• Fase 4: Logística\n• Fase 5: RH + Produção`
  }

  return `Entendi sua pergunta sobre "${msg}".\n\nPor ora respondo com dados básicos do Supabase. O Agente Fiscal completo (com Claude API integrado) entra na Fase 2 do ecossistema.\n\nPosso te ajudar com:\n• Custos de hoje ou do mês\n• Status dos agentes ativos\n• Resumo do ecossistema\n• Previsão das próximas fases`
}
