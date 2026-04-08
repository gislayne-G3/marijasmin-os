import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Bot, TrendingUp, Clock, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getCambioBrl, CAMBIO_FALLBACK } from '../../lib/cambio'
import {
  AGENTES_PRODUCAO,
  PRICING_FALLBACK,
  estimarCustoMensalUsd,
  type ModelPricing,
} from '../../lib/pricing'

interface EquipeHumana {
  id: string
  cargo: string
  salario_brl: number
  observacao: string | null
  ordem: number
}

interface ToolCost {
  ferramenta: string
  categoria: string
  custo_brl: number
  ativo: boolean
}

interface UsoReal {
  agent_name: string
  total_chamadas: number
  custo_total_brl: number
}

export default function CustosComparativo() {
  const [equipe, setEquipe] = useState<EquipeHumana[]>([])
  const [tools, setTools] = useState<ToolCost[]>([])
  const [pricing, setPricing] = useState<Record<string, ModelPricing>>(PRICING_FALLBACK)
  const [usoReal, setUsoReal] = useState<UsoReal[]>([])
  const [cambio, setCambio] = useState(CAMBIO_FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const [eq, tc, pr, uso, brl] = await Promise.all([
        supabase.from('equipe_humana_referencia').select('*').eq('ativo', true).order('ordem'),
        supabase.from('tool_costs').select('ferramenta,categoria,custo_brl,ativo').eq('ativo', true),
        supabase.from('model_pricing').select('*'),
        supabase.from('vw_agentes_custo_mes_atual').select('agent_name,total_chamadas,custo_total_brl'),
        getCambioBrl(),
      ])
      if (!mounted) return
      if (eq.data) setEquipe(eq.data as EquipeHumana[])
      if (tc.data) setTools(tc.data as ToolCost[])
      if (pr.data && pr.data.length > 0) {
        const map: Record<string, ModelPricing> = { ...PRICING_FALLBACK }
        for (const r of pr.data) {
          map[r.model] = {
            model: r.model,
            preco_input_usd_por_mtok: Number(r.preco_input_usd_por_mtok),
            preco_output_usd_por_mtok: Number(r.preco_output_usd_por_mtok),
          }
        }
        setPricing(map)
      }
      if (uso.data) setUsoReal(uso.data as UsoReal[])
      setCambio(brl)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const totalHumano = useMemo(() => equipe.reduce((s, e) => s + Number(e.salario_brl), 0), [equipe])

  const usoMap = useMemo(() => {
    const m: Record<string, UsoReal> = {}
    for (const u of usoReal) m[u.agent_name] = u
    return m
  }, [usoReal])

  // Custo IA: real se houver, senão estimativa
  const custoIATokens = useMemo(() => {
    let totalBrl = 0
    for (const ag of AGENTES_PRODUCAO) {
      const real = usoMap[ag.id]
      if (real && Number(real.custo_total_brl) > 0) {
        totalBrl += Number(real.custo_total_brl)
      } else {
        totalBrl += estimarCustoMensalUsd(ag, pricing) * cambio
      }
    }
    return totalBrl
  }, [usoMap, pricing, cambio])

  // Ferramentas: separar IA, infra e marketing pra entrar no comparativo
  const custoFerramentasIA = tools.filter((t) => t.categoria === 'ia').reduce((s, t) => s + Number(t.custo_brl), 0)
  const custoInfra = tools.filter((t) => t.categoria === 'infra' || t.categoria === 'plataforma').reduce((s, t) => s + Number(t.custo_brl), 0)

  // Custo total do ecossistema (sem incluir Meta Ads e Pessoas — esses são insumos de negócio, não substituem cargo)
  const custoEcossistema = custoIATokens + custoFerramentasIA + custoInfra
  const economia = totalHumano - custoEcossistema
  const roi = custoEcossistema > 0 ? economia / custoEcossistema : 0

  const totalConvMari = useMemo(() => {
    return AGENTES_PRODUCAO.filter((a) => a.id.startsWith('mari_')).reduce((s, a) => {
      const real = usoMap[a.id]
      return s + (real ? Number(real.total_chamadas) : a.estimativa.chamadas_mes)
    }, 0)
  }, [usoMap])

  const horasAgentes = 24 * 30 // 720h/mês de cobertura agentes (24x30)

  return (
    <div className="p-8">
      <Link to="/custos" className="inline-flex items-center gap-1 text-xs mb-4" style={{ color: '#6b5b6e' }}>
        <ArrowLeft size={13} /> Custos
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>Comparativo: Humano vs IA</h1>
        <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>
          Quanto custaria substituir o ecossistema por uma equipe humana equivalente
        </p>
      </div>

      {/* Métricas-chave */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card label="Economia mensal" value={`R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={economia > 0 ? 'a favor do ecossistema' : 'humano custa menos'} cor="#2d8c4e" highlight />
        <Card label="ROI do ecossistema" value={`${(roi * 100).toFixed(0)}%`} sub={`${(roi + 1).toFixed(1)}x retorno`} cor="#8e2753" />
        <Card label="Cobertura horária" value={`${horasAgentes}h/mês`} sub="agentes 24x7" cor="#0e2955" icon={Clock} />
        <Card label="Conversas Mari (mês)" value={totalConvMari.toLocaleString('pt-BR')} sub="WhatsApp + IG + Chatwoot" cor="#b45309" icon={MessageSquare} />
      </div>

      {/* Comparativo lado a lado */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* HUMANO */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #e8e4e8', background: 'rgba(180,83,9,0.05)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(180,83,9,0.15)' }}>
              <Users size={15} style={{ color: '#b45309' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>Equipe Humana Equivalente</h2>
              <p className="text-[10px]" style={{ color: '#9c8fa0' }}>9 cargos full-time CLT</p>
            </div>
          </div>
          <div>
            {equipe.map((e, i) => (
              <div key={e.id} className="px-5 py-2.5 flex items-center justify-between" style={{ borderBottom: i === equipe.length - 1 ? 'none' : '1px solid #f0eef0' }}>
                <div>
                  <p className="text-sm" style={{ color: '#0e2955' }}>{e.cargo}</p>
                  {e.observacao && <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{e.observacao}</p>}
                </div>
                <p className="text-sm font-medium" style={{ color: '#6b5b6e' }}>R$ {Number(e.salario_brl).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(180,83,9,0.05)', borderTop: '1px solid #e8e4e8' }}>
            <p className="text-sm font-semibold" style={{ color: '#0e2955' }}>TOTAL HUMANO</p>
            <p className="text-lg font-bold" style={{ color: '#b45309' }}>
              R$ {totalHumano.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* IA */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #e8e4e8', background: 'rgba(142,39,83,0.05)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(142,39,83,0.15)' }}>
              <Bot size={15} style={{ color: '#8e2753' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>Ecossistema Marijasmin</h2>
              <p className="text-[10px]" style={{ color: '#9c8fa0' }}>tokens + infra + plataformas</p>
            </div>
          </div>
          <div>
            <Linha label="Tokens IA (Mari + agentes)" sub={`${AGENTES_PRODUCAO.length} agentes ativos`} valor={custoIATokens} />
            <Linha label="Ferramentas IA" sub="Claude assinatura, OpenAI API, Fal AI" valor={custoFerramentasIA} />
            <Linha label="Infra + Plataformas" sub="Vercel, Railway, Tiny, WBuy, Nuvemshop" valor={custoInfra} />
          </div>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'rgba(142,39,83,0.05)', borderTop: '1px solid #e8e4e8' }}>
            <p className="text-sm font-semibold" style={{ color: '#0e2955' }}>TOTAL ECOSSISTEMA</p>
            <p className="text-lg font-bold" style={{ color: '#8e2753' }}>
              R$ {custoEcossistema.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="px-5 py-2 flex items-center justify-between" style={{ background: 'rgba(45,140,78,0.05)', borderTop: '1px solid #f0eef0' }}>
            <p className="text-xs font-medium" style={{ color: '#2d8c4e' }}>ECONOMIA GERADA</p>
            <p className="text-sm font-bold" style={{ color: '#2d8c4e' }}>
              R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
            </p>
          </div>
        </div>
      </div>

      {/* Insight box */}
      <div className="rounded-xl p-5 flex items-start gap-3" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(45,140,78,0.15)' }}>
          <TrendingUp size={15} style={{ color: '#2d8c4e' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold mb-1" style={{ color: '#0e2955' }}>
            Para cada R$ 1 investido no ecossistema, você economiza R$ {roi.toFixed(2)}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#6b5b6e' }}>
            O comparativo considera apenas custos diretos (tokens IA, infra e plataformas) — não inclui Meta Ads
            (R$ 5.000) nem salários atuais de Samily/analista, que são insumos de negócio independentes do
            ecossistema. Cobertura: {horasAgentes}h/mês de atendimento automatizado vs ~176h de um humano CLT.
          </p>
          <p className="text-[10px] mt-2" style={{ color: '#9c8fa0' }}>
            Câmbio USD/BRL: R$ {cambio.toFixed(2)} ({cambio === CAMBIO_FALLBACK ? 'fallback' : 'Banco Central'})
          </p>
        </div>
      </div>

      {loading && <p className="text-xs text-center mt-4" style={{ color: '#9c8fa0' }}>carregando...</p>}
    </div>
  )
}

function Card({
  label,
  value,
  sub,
  cor,
  icon: Icon,
  highlight,
}: {
  label: string
  value: string
  sub: string
  cor: string
  icon?: typeof Clock
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: highlight ? `${cor}08` : '#ffffff',
        border: highlight ? `1px solid ${cor}40` : '1px solid #e8e4e8',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wide" style={{ color: '#9c8fa0' }}>{label}</p>
        {Icon && <Icon size={13} style={{ color: cor }} />}
      </div>
      <p className="text-2xl font-bold" style={{ color: cor }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: '#9c8fa0' }}>{sub}</p>
    </div>
  )
}

function Linha({ label, sub, valor }: { label: string; sub: string; valor: number }) {
  return (
    <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f0eef0' }}>
      <div>
        <p className="text-sm" style={{ color: '#0e2955' }}>{label}</p>
        <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{sub}</p>
      </div>
      <p className="text-sm font-medium" style={{ color: '#0e2955' }}>R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  )
}
