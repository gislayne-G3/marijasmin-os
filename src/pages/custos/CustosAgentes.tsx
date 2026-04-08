import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bot, AlertCircle, Calculator } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getCambioBrl, CAMBIO_FALLBACK } from '../../lib/cambio'
import {
  AGENTES_PRODUCAO,
  PRICING_FALLBACK,
  estimarCustoMensalUsd,
  type ModelPricing,
  type AgentConfig,
} from '../../lib/pricing'

interface UsoReal {
  agent_name: string
  model: string
  total_chamadas: number
  total_tokens_input: number
  total_tokens_output: number
  custo_total_usd: number
  custo_total_brl: number
  ultima_chamada: string | null
}

export default function CustosAgentes() {
  const [pricing, setPricing] = useState<Record<string, ModelPricing>>(PRICING_FALLBACK)
  const [usoReal, setUsoReal] = useState<UsoReal[]>([])
  const [cambio, setCambio] = useState<number>(CAMBIO_FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const [pricingResp, usoResp, brl] = await Promise.all([
        supabase.from('model_pricing').select('*'),
        supabase.from('vw_agentes_custo_mes_atual').select('*'),
        getCambioBrl(),
      ])
      if (!mounted) return
      if (pricingResp.data && pricingResp.data.length > 0) {
        const map: Record<string, ModelPricing> = { ...PRICING_FALLBACK }
        for (const row of pricingResp.data) {
          map[row.model] = {
            model: row.model,
            preco_input_usd_por_mtok: Number(row.preco_input_usd_por_mtok),
            preco_output_usd_por_mtok: Number(row.preco_output_usd_por_mtok),
          }
        }
        setPricing(map)
      }
      if (usoResp.data) setUsoReal(usoResp.data as UsoReal[])
      setCambio(brl)
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const usoMap = useMemo(() => {
    const m: Record<string, UsoReal> = {}
    for (const u of usoReal) m[u.agent_name] = u
    return m
  }, [usoReal])

  const linhas = useMemo(() => {
    return AGENTES_PRODUCAO.map((ag) => {
      const real = usoMap[ag.id]
      const custoEstUsd = estimarCustoMensalUsd(ag, pricing)
      const custoEstBrl = custoEstUsd * cambio
      const custoRealUsd = real ? Number(real.custo_total_usd) : 0
      const custoRealBrl = real ? Number(real.custo_total_brl) : 0
      const tokensReais = real ? Number(real.total_tokens_input) + Number(real.total_tokens_output) : 0
      const chamadasReais = real ? Number(real.total_chamadas) : 0
      const temDado = real !== undefined && chamadasReais > 0
      return {
        ag,
        custoEstUsd,
        custoEstBrl,
        custoRealUsd,
        custoRealBrl,
        chamadasReais,
        tokensReais,
        temDado,
      }
    })
  }, [pricing, usoMap, cambio])

  const totais = useMemo(() => {
    const estUsd = linhas.reduce((s, l) => s + l.custoEstUsd, 0)
    const realUsd = linhas.reduce((s, l) => s + l.custoRealUsd, 0)
    const realBrl = linhas.reduce((s, l) => s + l.custoRealBrl, 0)
    const callsReal = linhas.reduce((s, l) => s + l.chamadasReais, 0)
    return {
      estUsd,
      estBrl: estUsd * cambio,
      realUsd,
      realBrl,
      callsReal,
      semDados: linhas.filter((l) => !l.temDado).length,
    }
  }, [linhas, cambio])

  return (
    <div className="p-8">
      <Link
        to="/custos"
        className="inline-flex items-center gap-1 text-xs mb-4"
        style={{ color: '#6b5b6e' }}
      >
        <ArrowLeft size={13} /> Custos
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>
            Custos por Agente
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>
            Estimativa baseline + uso real registrado em <code>agent_usage_log</code>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide" style={{ color: '#9c8fa0' }}>
            câmbio USD → BRL
          </p>
          <p className="text-sm font-semibold" style={{ color: '#0e2955' }}>
            R$ {cambio.toFixed(2)}
          </p>
          <p className="text-[10px]" style={{ color: '#9c8fa0' }}>
            {cambio === CAMBIO_FALLBACK ? 'fallback' : 'Banco Central'}
          </p>
        </div>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card label="Custo real (mês)" value={`R$ ${totais.realBrl.toFixed(2)}`} sub={`USD ${totais.realUsd.toFixed(4)}`} cor="#2d8c4e" />
        <Card label="Custo estimado (mês)" value={`R$ ${totais.estBrl.toFixed(2)}`} sub={`USD ${totais.estUsd.toFixed(4)}`} cor="#8e2753" />
        <Card label="Chamadas registradas" value={totais.callsReal.toLocaleString('pt-BR')} sub="mês corrente" cor="#0e2955" />
        <Card label="Agentes em produção" value={`${AGENTES_PRODUCAO.length}`} sub={`${totais.semDados} ainda sem dados`} cor="#b45309" />
      </div>

      {totais.semDados > 0 && totais.callsReal === 0 && (
        <div
          className="rounded-lg p-4 mb-6 flex items-start gap-3"
          style={{ background: '#fff8e6', border: '1px solid #fde6a0' }}
        >
          <AlertCircle size={16} style={{ color: '#b45309' }} className="mt-0.5" />
          <div className="text-xs leading-relaxed" style={{ color: '#7c4a00' }}>
            <strong>Sem dados reais ainda.</strong> Os custos abaixo são estimativas baseadas no
            volume médio de cada agente. Para mostrar números reais, os workflows do n8n precisam
            registrar cada chamada na tabela <code>agent_usage_log</code>. Veja o card "Como
            integrar" no fim da página.
          </div>
        </div>
      )}

      {/* Tabela */}
      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}
      >
        <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #e8e4e8' }}>
          <Bot size={15} style={{ color: '#8e2753' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>
            Detalhe por agente
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #e8e4e8' }}>
              {['Agente', 'Modelo', 'Volume estimado', 'Custo real (mês)', 'Custo estimado'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] uppercase font-medium tracking-wide" style={{ color: '#9c8fa0' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={l.ag.id} style={{ borderBottom: i === linhas.length - 1 ? 'none' : '1px solid #f0eef0' }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{l.ag.emoji}</span>
                    <div>
                      <p className="font-medium" style={{ color: '#0e2955' }}>{l.ag.nome}</p>
                      <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{l.ag.canal}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs">
                  <ModeloTag modelo={l.ag.modelo} />
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: '#6b5b6e' }}>
                  {l.ag.estimativa.chamadas_mes.toLocaleString('pt-BR')}/mês
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>
                    ~{l.ag.estimativa.tokens_input_med}+{l.ag.estimativa.tokens_output_med} tok
                  </p>
                </td>
                <td className="px-5 py-3">
                  {l.temDado ? (
                    <>
                      <p className="font-medium text-sm" style={{ color: '#2d8c4e' }}>R$ {l.custoRealBrl.toFixed(2)}</p>
                      <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{l.chamadasReais.toLocaleString('pt-BR')} calls · {l.tokensReais.toLocaleString('pt-BR')} tok</p>
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: '#9c8fa0' }}>—</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-sm" style={{ color: '#0e2955' }}>R$ {l.custoEstBrl.toFixed(2)}</p>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>USD {l.custoEstUsd.toFixed(4)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Como integrar */}
      <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={15} style={{ color: '#0e2955' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>Como ativar custos reais (n8n)</h2>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: '#6b5b6e' }}>
          Para mostrar números reais aqui, cada workflow Mari precisa fazer um POST no Supabase
          após a chamada Anthropic, registrando os tokens retornados na resposta:
        </p>
        <pre className="text-[10px] leading-relaxed p-3 rounded-lg overflow-x-auto" style={{ background: '#f7f5f5', color: '#0e2955' }}>{`POST https://oovdayewoaeyaolzoesq.supabase.co/rest/v1/agent_usage_log
Headers: apikey + Authorization (anon)
Body: {
  "agent_name": "mari_sdr_whatsapp",
  "model": "claude-haiku-4-5-20251001",
  "input_tokens": {{ $json.usage.input_tokens }},
  "output_tokens": {{ $json.usage.output_tokens }},
  "custo_usd": (input/1M * 1.00) + (output/1M * 5.00),
  "custo_brl": custo_usd * cambio
}`}</pre>
        <p className="text-[10px] mt-3" style={{ color: '#9c8fa0' }}>
          Adicionar 1 node "HTTP Request" depois do node "Claude API" em cada workflow (WF12, WF14, WF16, WF13).
        </p>
      </div>

      {loading && (
        <p className="text-xs text-center mt-4" style={{ color: '#9c8fa0' }}>carregando...</p>
      )}
    </div>
  )
}

function Card({ label, value, sub, cor }: { label: string; value: string; sub: string; cor: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
      <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: '#9c8fa0' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: cor }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: '#9c8fa0' }}>{sub}</p>
    </div>
  )
}

function ModeloTag({ modelo }: { modelo: AgentConfig['modelo'] }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    'claude-haiku-4-5-20251001': { label: 'Haiku 4.5', bg: 'rgba(142,39,83,0.1)', color: '#8e2753' },
    'claude-sonnet-4-6':         { label: 'Sonnet 4.6', bg: 'rgba(14,41,85,0.1)', color: '#0e2955' },
    'claude-sonnet-4-20250514':  { label: 'Sonnet 4',   bg: 'rgba(14,41,85,0.1)', color: '#0e2955' },
    'claude-opus-4-6':           { label: 'Opus 4.6',   bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
    'gpt-4o-mini':               { label: 'GPT-4o-mini', bg: 'rgba(45,140,78,0.1)', color: '#2d8c4e' },
    'gpt-4o':                    { label: 'GPT-4o',     bg: 'rgba(45,140,78,0.1)', color: '#2d8c4e' },
  }
  const t = map[modelo] || { label: modelo, bg: '#f0eef0', color: '#6b5b6e' }
  return (
    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: t.bg, color: t.color }}>
      {t.label}
    </span>
  )
}
