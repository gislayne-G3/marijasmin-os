export interface Agent {
  id: string
  nome: string
  emoji: string
  descricao: string
  modelo: string
  status: 'ativo' | 'em_breve'
  canal: string
  sistema: string
  estimativa: {
    chamadas_mes: number
    tokens_input_med: number
    tokens_output_med: number
  }
}

export const AGENTES: Agent[] = [
  {
    id: 'mari_sdr',
    nome: 'Mari SDR',
    emoji: '💬',
    descricao: 'Atendimento 24h via WhatsApp. Qualifica leads, reconhece clientes, responde dúvidas.',
    modelo: 'claude-haiku-4-5-20251001',
    status: 'ativo',
    canal: 'WhatsApp DM',
    sistema: 'CRM',
    estimativa: { chamadas_mes: 3000, tokens_input_med: 800, tokens_output_med: 200 },
  },
  {
    id: 'pix_ocr',
    nome: 'OCR PIX',
    emoji: '📸',
    descricao: 'Lê comprovantes de PIX enviados no WhatsApp e registra pagamentos automaticamente.',
    modelo: 'claude-haiku-4-5-20251001',
    status: 'ativo',
    canal: 'WhatsApp Grupo',
    sistema: 'CRM',
    estimativa: { chamadas_mes: 300, tokens_input_med: 400, tokens_output_med: 100 },
  },
  {
    id: 'links_pagarme',
    nome: 'Links Pagar.me',
    emoji: '🔗',
    descricao: 'Gera links de pagamento Pagar.me ao detectar pedidos no grupo de vendas.',
    modelo: 'claude-haiku-4-5-20251001',
    status: 'ativo',
    canal: 'WhatsApp Grupo',
    sistema: 'CRM',
    estimativa: { chamadas_mes: 500, tokens_input_med: 300, tokens_output_med: 150 },
  },
  {
    id: 'agente_fiscal',
    nome: 'Agente Fiscal',
    emoji: '🔍',
    descricao: 'Monitora métricas do CRM, alerta lead parado +48h, vendedora abaixo da meta.',
    modelo: 'claude-sonnet-4-6',
    status: 'em_breve',
    canal: 'Interno',
    sistema: 'OS',
    estimativa: { chamadas_mes: 30, tokens_input_med: 3000, tokens_output_med: 800 },
  },
  {
    id: 'financeiro_estrategista',
    nome: 'Financeiro Estrategista',
    emoji: '💰',
    descricao: 'Lê o DRE, identifica vazamentos e cria plano de saída de dívidas com prazo.',
    modelo: 'claude-sonnet-4-6',
    status: 'em_breve',
    canal: 'Chat OS',
    sistema: 'Financeiro',
    estimativa: { chamadas_mes: 60, tokens_input_med: 5000, tokens_output_med: 1500 },
  },
  {
    id: 'agente_conciliacao',
    nome: 'Conciliação Bancária',
    emoji: '🏦',
    descricao: 'Cruza Tiny com banco, separa trocas da receita real, detecta inadimplência.',
    modelo: 'claude-haiku-4-5-20251001',
    status: 'em_breve',
    canal: 'Interno',
    sistema: 'Financeiro',
    estimativa: { chamadas_mes: 120, tokens_input_med: 2000, tokens_output_med: 400 },
  },
  {
    id: 'email_marketing',
    nome: 'Email Marketing',
    emoji: '📧',
    descricao: 'Segmenta Supabase, escreve com Claude, dispara via Resend. Campanhas de reativação.',
    modelo: 'claude-sonnet-4-6',
    status: 'em_breve',
    canal: 'Resend',
    sistema: 'Marketing',
    estimativa: { chamadas_mes: 20, tokens_input_med: 4000, tokens_output_med: 2000 },
  },
  {
    id: 'agente_copy',
    nome: 'Agente Copy',
    emoji: '✍️',
    descricao: 'Copy de campanha, legendas, ideias para Canva e reels. Tom cristão e modesto.',
    modelo: 'claude-sonnet-4-6',
    status: 'em_breve',
    canal: 'Chat OS',
    sistema: 'Marketing',
    estimativa: { chamadas_mes: 100, tokens_input_med: 1500, tokens_output_med: 1000 },
  },
  {
    id: 'social_media',
    nome: 'Social Media',
    emoji: '📱',
    descricao: 'Analisa IG, TikTok, Facebook. Insights de performance semanais.',
    modelo: 'claude-sonnet-4-6',
    status: 'em_breve',
    canal: 'Manus/ManyChat',
    sistema: 'Marketing',
    estimativa: { chamadas_mes: 30, tokens_input_med: 2000, tokens_output_med: 800 },
  },
  {
    id: 'agente_seo',
    nome: 'Agente SEO + Blog',
    emoji: '🔎',
    descricao: 'Analisa sites, cria posts otimizados para Google. Nicho moda cristã e modesta.',
    modelo: 'claude-sonnet-4-6',
    status: 'em_breve',
    canal: 'Interno',
    sistema: 'Marketing',
    estimativa: { chamadas_mes: 20, tokens_input_med: 3000, tokens_output_med: 2000 },
  },
  {
    id: 'agente_rastreio',
    nome: 'Rastreio',
    emoji: '📦',
    descricao: 'Notifica cliente no WhatsApp a cada mudança de status. Elimina 80% das perguntas.',
    modelo: 'claude-haiku-4-5-20251001',
    status: 'em_breve',
    canal: 'WhatsApp',
    sistema: 'Logística',
    estimativa: { chamadas_mes: 2000, tokens_input_med: 300, tokens_output_med: 150 },
  },
  {
    id: 'agente_trocas',
    nome: 'Trocas',
    emoji: '🔄',
    descricao: 'Integra Troque Ecommerce ao Supabase. Analisa causas de devolução.',
    modelo: 'claude-haiku-4-5-20251001',
    status: 'em_breve',
    canal: 'Troque Ecommerce',
    sistema: 'Logística',
    estimativa: { chamadas_mes: 200, tokens_input_med: 500, tokens_output_med: 200 },
  },
  {
    id: 'agente_rh',
    nome: 'Agente RH',
    emoji: '👥',
    descricao: 'Comissões automáticas, alertas de férias, análise de desempenho.',
    modelo: 'claude-sonnet-4-6',
    status: 'em_breve',
    canal: 'Interno',
    sistema: 'RH',
    estimativa: { chamadas_mes: 30, tokens_input_med: 2000, tokens_output_med: 500 },
  },
  {
    id: 'agente_producao',
    nome: 'Agente Produção',
    emoji: '🏭',
    descricao: 'Produção diária vs meta, matéria prima, cálculo de bônus por setor.',
    modelo: 'claude-haiku-4-5-20251001',
    status: 'em_breve',
    canal: 'Interno',
    sistema: 'RH',
    estimativa: { chamadas_mes: 60, tokens_input_med: 1000, tokens_output_med: 300 },
  },
]

const PRECOS_HAIKU = { input: 0.80 / 1_000_000, output: 4.00 / 1_000_000 }
const PRECOS_SONNET = { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 }

export function estimarCustoMensal(agente: Agent) {
  const precos = agente.modelo.includes('haiku') ? PRECOS_HAIKU : PRECOS_SONNET
  const custo = agente.estimativa.chamadas_mes * (
    agente.estimativa.tokens_input_med * precos.input +
    agente.estimativa.tokens_output_med * precos.output
  )
  return { usd: custo, brl: custo * 5.8 }
}

export function custoTotalEcossistema() {
  return AGENTES.reduce((acc, a) => {
    const c = estimarCustoMensal(a)
    return { usd: acc.usd + c.usd, brl: acc.brl + c.brl }
  }, { usd: 0, brl: 0 })
}
