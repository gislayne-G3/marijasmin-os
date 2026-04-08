import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AGENTES, estimarCustoMensal } from '../lib/agents'
import { getCambioBrl, CAMBIO_FALLBACK } from '../lib/cambio'
import {
  AGENTES_PRODUCAO,
  PRICING_FALLBACK,
  estimarCustoMensalUsd,
  type ModelPricing,
} from '../lib/pricing'
import {
  Bot,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Zap,
  CheckCircle2,
  Clock,
  Scale,
  Image as ImageIcon,
  Megaphone,
  ArrowRight,
} from 'lucide-react'

interface UsoReal {
  agent_name: string
  total_chamadas: number
  custo_total_brl: number
}

interface EquipeRef {
  salario_brl: number
}

interface ToolCost {
  categoria: string
  custo_brl: number
}

export default function Dashboard() {
  const [pricing, setPricing] = useState<Record<string, ModelPricing>>(PRICING_FALLBACK)
  const [usoReal, setUsoReal] = useState<UsoReal[]>([])
  const [equipe, setEquipe] = useState<EquipeRef[]>([])
  const [tools, setTools] = useState<ToolCost[]>([])
  const [cambio, setCambio] = useState(CAMBIO_FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const [pr, uso, eq, tc, brl] = await Promise.all([
        supabase.from('model_pricing').select('*'),
        supabase.from('vw_agentes_custo_mes_atual').select('agent_name,total_chamadas,custo_total_brl'),
        supabase.from('equipe_humana_referencia').select('salario_brl').eq('ativo', true),
        supabase.from('tool_costs').select('categoria,custo_brl').eq('ativo', true),
        getCambioBrl(),
      ])
      if (!mounted) return
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
      if (eq.data) setEquipe(eq.data as EquipeRef[])
      if (tc.data) setTools(tc.data as ToolCost[])
      setCambio(brl)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const usoMap = useMemo(() => {
    const m: Record<string, UsoReal> = {}
    for (const u of usoReal) m[u.agent_name] = u
    return m
  }, [usoReal])

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

  const totalChamadasMari = useMemo(() => {
    return AGENTES_PRODUCAO.filter((a) => a.id.startsWith('mari_')).reduce((s, a) => {
      const real = usoMap[a.id]
      return s + (real ? Number(real.total_chamadas) : a.estimativa.chamadas_mes)
    }, 0)
  }, [usoMap])

  const custoFerramentasIA = tools.filter((t) => t.categoria === 'ia').reduce((s, t) => s + Number(t.custo_brl), 0)
  const custoInfra = tools.filter((t) => t.categoria === 'infra' || t.categoria === 'plataforma').reduce((s, t) => s + Number(t.custo_brl), 0)
  const totalHumano = equipe.reduce((s, e) => s + Number(e.salario_brl), 0)
  const custoEcossistema = custoIATokens + custoFerramentasIA + custoInfra
  const economia = totalHumano - custoEcossistema
  const roi = custoEcossistema > 0 ? economia / custoEcossistema : 0

  const ativos = AGENTES.filter(a => a.status === 'ativo')
  const emBreve = AGENTES.filter(a => a.status === 'em_breve')

  const STATS = [
    {
      label: 'Custo total (mês)',
      value: loading ? '...' : `R$ ${custoEcossistema.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: '#8e2753',
      bg: 'rgba(142,39,83,0.1)',
      sub: 'tokens + infra + plataformas',
    },
    {
      label: 'Economia vs humanos',
      value: loading ? '...' : `R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: TrendingUp,
      color: '#2d8c4e',
      bg: 'rgba(45,140,78,0.1)',
      sub: `vs ${equipe.length} cargos CLT`,
    },
    {
      label: 'ROI ecossistema',
      value: loading ? '...' : `${(roi * 100).toFixed(0)}%`,
      icon: Scale,
      color: '#0e2955',
      bg: 'rgba(14,41,85,0.1)',
      sub: `${(roi + 1).toFixed(1)}x retorno`,
    },
    {
      label: 'Conversas Mari',
      value: loading ? '...' : totalChamadasMari.toLocaleString('pt-BR'),
      icon: MessageSquare,
      color: '#b45309',
      bg: 'rgba(180,83,9,0.1)',
      sub: 'WhatsApp + IG + Chatwoot',
    },
  ]

  const SECONDARY = [
    {
      label: 'Agentes em produção',
      value: `${AGENTES_PRODUCAO.length}`,
      icon: Bot,
      color: '#8e2753',
      sub: `${ativos.length}/${AGENTES.length} no roadmap`,
    },
    {
      label: 'Imagens Studio (mês)',
      value: '—',
      icon: ImageIcon,
      color: '#7c3aed',
      sub: 'em breve · marijasmin-marketing',
    },
    {
      label: 'Campanhas publicadas',
      value: '—',
      icon: Megaphone,
      color: '#0e2955',
      sub: 'em breve · marijasmin-marketing',
    },
    {
      label: 'Câmbio USD/BRL',
      value: `R$ ${cambio.toFixed(2)}`,
      icon: TrendingUp,
      color: '#2d8c4e',
      sub: cambio === CAMBIO_FALLBACK ? 'fallback' : 'Banco Central',
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>Visão geral do ecossistema marijasmin OS</p>
        </div>
        <Link
          to="/custos"
          className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg"
          style={{ background: '#8e2753', color: '#ffffff' }}
        >
          Painel completo de custos <ArrowRight size={12} />
        </Link>
      </div>

      {/* Stats grid principal — custos & ROI */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {STATS.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wide" style={{ color: '#9c8fa0' }}>{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            {sub && <p className="text-[10px] mt-1" style={{ color: '#9c8fa0' }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Stats grid secundário — operação */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {SECONDARY.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color }} />
              <p className="text-[10px] uppercase tracking-wide" style={{ color: '#9c8fa0' }}>{label}</p>
            </div>
            <p className="text-xl font-semibold" style={{ color: '#0e2955' }}>{value}</p>
            {sub && <p className="text-[10px] mt-0.5" style={{ color: '#9c8fa0' }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Sistemas overview */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Agentes ativos */}
        <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} style={{ color: '#2d8c4e' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>Agentes em Produção</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(45,140,78,0.1)', color: '#2d8c4e' }}>{ativos.length} ativos</span>
          </div>
          <div className="space-y-2">
            {ativos.map(a => {
              const custo = estimarCustoMensal(a)
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f7f5f5' }}>
                  <span className="text-xl">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#0e2955' }}>{a.nome}</p>
                    <p className="text-xs" style={{ color: '#9c8fa0' }}>{a.canal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium" style={{ color: '#2d8c4e' }}>R$ {custo.brl.toFixed(2)}/mês</p>
                    <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{a.estimativa.chamadas_mes} calls</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Em breve */}
        <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} style={{ color: '#b45309' }} />
            <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>Próximos Agentes</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(180,83,9,0.1)', color: '#b45309' }}>{emBreve.length} planejados</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {emBreve.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: '#f7f5f5' }}>
                <span className="text-lg">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: '#0e2955' }}>{a.nome}</p>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{a.sistema}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#f0eef0', color: '#6b5b6e' }}>{a.modelo.includes('haiku') ? 'Haiku' : 'Sonnet'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} style={{ color: '#8e2753' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>Roadmap — 5 Sistemas</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { nome: 'CRM Comercial', fase: 1, status: 'ativo', agentes: 2, cor: '#2d8c4e' },
            { nome: 'Financeiro', fase: 2, status: 'breve', agentes: 2, cor: '#0e2955' },
            { nome: 'Marketing', fase: 3, status: 'breve', agentes: 7, cor: '#8e2753' },
            { nome: 'Logística', fase: 4, status: 'breve', agentes: 2, cor: '#b45309' },
            { nome: 'RH + Produção', fase: 5, status: 'breve', agentes: 2, cor: '#7c3aed' },
          ].map(s => (
            <div key={s.fase} className="rounded-lg p-3 text-center" style={{ background: '#f7f5f5' }}>
              <div className="w-2 h-2 rounded-full mx-auto mb-2" style={{ background: s.cor }} />
              <p className="text-xs font-medium" style={{ color: '#0e2955' }}>Fase {s.fase}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#6b5b6e' }}>{s.nome}</p>
              <p className="text-[10px] mt-1" style={{ color: '#9c8fa0' }}>{s.agentes} agentes</p>
              <span
                className="inline-block mt-2 text-[9px] px-2 py-0.5 rounded-full"
                style={s.status === 'ativo'
                  ? { background: 'rgba(45,140,78,0.1)', color: '#2d8c4e' }
                  : { background: '#f0eef0', color: '#9c8fa0' }
                }
              >
                {s.status === 'ativo' ? 'ativo' : 'planejado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
