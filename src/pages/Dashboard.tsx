import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AGENTES, custoTotalEcossistema, estimarCustoMensal } from '../lib/agents'
import { Bot, MessageSquare, DollarSign, TrendingUp, Zap, CheckCircle2, Clock } from 'lucide-react'

interface ResumoMes {
  total_chamadas: number
  custo_total_usd: number
  custo_total_brl: number
}

export default function Dashboard() {
  const [resumo, setResumo] = useState<ResumoMes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('agentes_uso')
        .select('tokens_input, tokens_output, custo_usd')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (data) {
        const total_chamadas = data.length
        const custo_total_usd = data.reduce((s, r) => s + Number(r.custo_usd), 0)
        setResumo({ total_chamadas, custo_total_usd, custo_total_brl: custo_total_usd * 5.8 })
      }
      setLoading(false)
    }
    load()
  }, [])

  const estimativa = custoTotalEcossistema()
  const ativos = AGENTES.filter(a => a.status === 'ativo')
  const emBreve = AGENTES.filter(a => a.status === 'em_breve')

  const STATS = [
    {
      label: 'Agentes Ativos',
      value: `${ativos.length} / ${AGENTES.length}`,
      icon: Bot,
      color: '#8e2753',
      bg: 'rgba(142,39,83,0.1)',
    },
    {
      label: 'Chamadas (30d)',
      value: loading ? '...' : (resumo?.total_chamadas ?? 0).toLocaleString('pt-BR'),
      icon: MessageSquare,
      color: '#0e2955',
      bg: 'rgba(14,41,85,0.1)',
    },
    {
      label: 'Custo Real (30d)',
      value: loading ? '...' : `R$ ${(resumo?.custo_total_brl ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: '#2d8c4e',
      bg: 'rgba(45,140,78,0.1)',
    },
    {
      label: 'Custo Estimado/mês',
      value: `R$ ${estimativa.brl.toFixed(2)}`,
      icon: TrendingUp,
      color: '#b45309',
      bg: 'rgba(180,83,9,0.1)',
      sub: `USD ${estimativa.usd.toFixed(4)}`,
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>Visão geral do ecossistema marijasmin OS</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wide" style={{ color: '#9c8fa0' }}>{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#0e2955' }}>{value}</p>
            {sub && <p className="text-xs mt-1" style={{ color: '#9c8fa0' }}>{sub}</p>}
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
                {s.status === 'ativo' ? '✓ ativo' : 'planejado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
