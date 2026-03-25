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
    <div className="flex flex-col h-screen" style={{ background: '#f7f5f5' }}>
      {/* Header */}
      <div className="px-8 py-5" style={{ borderBottom: '1px solid #e8e4e8', background: '#ffffff' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(142,39,83,0.1)' }}>
            <Bot size={18} style={{ color: '#8e2753' }} />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: '#0e2955' }}>Chat Fiscal</h1>
            <p className="text-xs" style={{ color: '#9c8fa0' }}>Agente Fiscal · Dados em tempo real do Supabase</p>
          </div>
          <span className="ml-auto text-[10px] px-2 py-1 rounded-full" style={{ background: 'rgba(45,140,78,0.1)', color: '#2d8c4e' }}>● online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={m.role === 'user'
                ? { background: '#8e2753' }
                : { background: '#ffffff', border: '1px solid #e8e4e8' }
              }
            >
              {m.role === 'user'
                ? <User size={14} className="text-white" />
                : <Bot size={14} style={{ color: '#8e2753' }} />}
            </div>
            <div className={`max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={m.role === 'user'
                  ? { background: '#8e2753', color: '#ffffff', borderTopRightRadius: '4px' }
                  : { background: '#ffffff', border: '1px solid #e8e4e8', color: '#0e2955', borderTopLeftRadius: '4px' }
                }
              >
                {m.content}
              </div>
              <p className="text-[10px] px-1" style={{ color: '#9c8fa0' }}>
                {new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
              <Bot size={14} style={{ color: '#8e2753' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: '#8e2753' }} />
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
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{ background: '#ffffff', border: '1px solid #e8e4e8', color: '#6b5b6e' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#8e2753'
                e.currentTarget.style.color = '#8e2753'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e8e4e8'
                e.currentTarget.style.color = '#6b5b6e'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-8 py-5" style={{ borderTop: '1px solid #e8e4e8', background: '#ffffff' }}>
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
            placeholder="Pergunte sobre agentes, custos, tokens..."
            className="flex-1 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
            style={{ background: '#f7f5f5', border: '1px solid #e8e4e8', color: '#0e2955' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#8e2753')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e8e4e8')}
          />
          <button
            onClick={() => enviar()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
            style={{ background: '#8e2753' }}
            onMouseEnter={e => !(!input.trim() || loading) && (e.currentTarget.style.background = '#6b1d3e')}
            onMouseLeave={e => (e.currentTarget.style.background = '#8e2753')}
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
    return `Resumo do ecossistema marijasmin OS:\n\n📊 **Custo mês atual:** R$ ${dados.custoMesTotal.toFixed(4)}\n🤖 **Agentes ativos:** 3 de 14\n💡 **Fase atual:** Fase 1 — CRM Comercial\n\n**Próximas fases:**\n• Fase 2: Financeiro (semanas 4-6)\n• Fase 3: Marketing completo\n• Fase 4: Logística\n• Fase 5: RH + Produção`
  }

  return `Entendi sua pergunta sobre "${msg}".\n\nPor ora respondo com dados básicos do Supabase. O Agente Fiscal completo (com Claude API integrado) entra na Fase 2 do ecossistema.\n\nPosso te ajudar com:\n• Custos de hoje ou do mês\n• Status dos agentes ativos\n• Resumo do ecossistema\n• Previsão das próximas fases`
}
