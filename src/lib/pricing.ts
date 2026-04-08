// Pricing helpers e lista canônica de agentes EM PRODUÇÃO HOJE
// Os preços vêm do Supabase (model_pricing) no runtime; este arquivo
// guarda fallbacks e descreve qual modelo cada agente real usa.

export type ModelKey =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-6'
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-6'
  | 'gpt-4o-mini'
  | 'gpt-4o'

export interface ModelPricing {
  model: string
  preco_input_usd_por_mtok: number
  preco_output_usd_por_mtok: number
}

export const PRICING_FALLBACK: Record<string, ModelPricing> = {
  'claude-haiku-4-5-20251001': { model: 'claude-haiku-4-5-20251001', preco_input_usd_por_mtok: 1.00, preco_output_usd_por_mtok: 5.00 },
  'claude-sonnet-4-6':         { model: 'claude-sonnet-4-6',         preco_input_usd_por_mtok: 3.00, preco_output_usd_por_mtok: 15.00 },
  'claude-sonnet-4-20250514':  { model: 'claude-sonnet-4-20250514',  preco_input_usd_por_mtok: 3.00, preco_output_usd_por_mtok: 15.00 },
  'claude-opus-4-6':           { model: 'claude-opus-4-6',           preco_input_usd_por_mtok: 15.00, preco_output_usd_por_mtok: 75.00 },
  'gpt-4o-mini':               { model: 'gpt-4o-mini',               preco_input_usd_por_mtok: 0.15, preco_output_usd_por_mtok: 0.60 },
  'gpt-4o':                    { model: 'gpt-4o',                    preco_input_usd_por_mtok: 2.50, preco_output_usd_por_mtok: 10.00 },
}

export function calcCustoUsd(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing,
): number {
  const i = (inputTokens / 1_000_000) * pricing.preco_input_usd_por_mtok
  const o = (outputTokens / 1_000_000) * pricing.preco_output_usd_por_mtok
  return i + o
}

// ════ Agentes EM PRODUÇÃO (estado em 08/04/2026) ════
// Atenção: este é o "registro de configuração" do que está rodando.
// Os custos REAIS vêm de agent_usage_log; isto aqui é a estimativa baseline.

export interface AgentConfig {
  id: string
  nome: string
  emoji: string
  modelo: ModelKey
  canal: string
  workflow_n8n?: string
  status: 'producao' | 'parcial' | 'planejado'
  estimativa: {
    chamadas_mes: number
    tokens_input_med: number
    tokens_output_med: number
  }
  descricao: string
}

export const AGENTES_PRODUCAO: AgentConfig[] = [
  {
    id: 'mari_sdr_whatsapp',
    nome: 'Mari SDR WhatsApp',
    emoji: '💬',
    modelo: 'claude-haiku-4-5-20251001',
    canal: 'WhatsApp (Evolution API)',
    workflow_n8n: 'WF12 — Mari SDR WhatsApp',
    status: 'producao',
    estimativa: { chamadas_mes: 9000, tokens_input_med: 800, tokens_output_med: 200 }, // ~300 conv/dia
    descricao: 'Atendimento 24h via WhatsApp. Qualifica leads, reconhece clientes, atribui ads.',
  },
  {
    id: 'mari_chatwoot',
    nome: 'Mari Multicanal Chatwoot',
    emoji: '💠',
    modelo: 'claude-haiku-4-5-20251001',
    canal: 'Instagram DM + Facebook DM + TikTok (via Chatwoot)',
    workflow_n8n: 'WF14 — Mari Multicanal Chatwoot',
    status: 'producao',
    estimativa: { chamadas_mes: 1500, tokens_input_med: 700, tokens_output_med: 200 },
    descricao: 'Atende as DMs unificadas via Chatwoot.',
  },
  {
    id: 'mari_instagram',
    nome: 'Mari Instagram (DMs + Comentários)',
    emoji: '📱',
    modelo: 'claude-haiku-4-5-20251001',
    canal: 'Instagram Webhook direto',
    workflow_n8n: 'WF16 — Instagram Webhook Realtime',
    status: 'producao',
    estimativa: { chamadas_mes: 3000, tokens_input_med: 600, tokens_output_med: 200 }, // DMs + comentários
    descricao: 'Webhook direto do Instagram: DMs em tempo real e respostas em comentários.',
  },
  {
    id: 'mari_aprendizado',
    nome: 'Mari Aprendizado Semanal',
    emoji: '🧠',
    modelo: 'claude-haiku-4-5-20251001',
    canal: 'Cron domingo 23h',
    workflow_n8n: 'WF13 — Mari Aprendizado Semanal',
    status: 'producao',
    estimativa: { chamadas_mes: 4, tokens_input_med: 8000, tokens_output_med: 3000 }, // 1x/semana, prompt grande
    descricao: 'Roda 1x por semana analisando conversas, gera insights e padrões.',
  },
  {
    id: 'pix_ocr',
    nome: 'OCR PIX',
    emoji: '📸',
    modelo: 'claude-haiku-4-5-20251001',
    canal: 'WhatsApp Grupo',
    status: 'producao',
    estimativa: { chamadas_mes: 300, tokens_input_med: 400, tokens_output_med: 100 },
    descricao: 'Lê comprovantes de PIX no WhatsApp e registra pagamentos.',
  },
  {
    id: 'links_pagarme',
    nome: 'Links Pagar.me',
    emoji: '🔗',
    modelo: 'claude-haiku-4-5-20251001',
    canal: 'WhatsApp Grupo',
    status: 'producao',
    estimativa: { chamadas_mes: 500, tokens_input_med: 300, tokens_output_med: 150 },
    descricao: 'Gera links de pagamento ao detectar pedidos no grupo de vendas.',
  },
]

export function estimarCustoMensalUsd(
  ag: AgentConfig,
  pricing: Record<string, ModelPricing>,
): number {
  const p = pricing[ag.modelo] || PRICING_FALLBACK[ag.modelo]
  if (!p) return 0
  const tokensInputTotal = ag.estimativa.chamadas_mes * ag.estimativa.tokens_input_med
  const tokensOutputTotal = ag.estimativa.chamadas_mes * ag.estimativa.tokens_output_med
  return calcCustoUsd(tokensInputTotal, tokensOutputTotal, p)
}

export function totalEstimadoUsd(pricing: Record<string, ModelPricing>): number {
  return AGENTES_PRODUCAO.reduce((acc, ag) => acc + estimarCustoMensalUsd(ag, pricing), 0)
}
