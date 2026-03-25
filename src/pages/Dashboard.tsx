import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AGENTES, custoTotalEcossistema, estimarCustoMensal } from '../lib/agents'
import { Bot, MessageSquare, DollarSign, TrendingUp, Zap, CheckCircle2, Clock } from 'lucide-react'
import clsx from 'clsx'

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
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Chamadas (30d)',
      value: loading ? '...' : (resumo?.total_chamadas ?? 0).toLocaleString('pt-BR'),
      icon: MessageSquare,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Custo Real (30d)',
      value: loading ? '...' : `R$ ${(resumo?.custo_total_brl ?? 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Custo Estimado/mês',
      value: `R$ ${estimativa.brl.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      sub: `USD ${estimativa.usd.toFixed(4)}`,
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral do ecossistema Marijasmim OS</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className="bg-[#16161f] border border-[#2a2a38] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Sistemas overview */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Agentes ativos */}
        <div className="bg-[#16161f] border border-[#2a2a38] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} className="text-green-400" />
            <h2 className="text-sm font-semibold text-white">Agentes em Produção</h2>
            <span className="ml-auto text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{ativos.length} ativos</span>
          </div>
          <div className="space-y-2">
            {ativos.map(a => {
              const custo = estimarCustoMensal(a)
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 bg-[#1e1e2a] rounded-lg">
                  <span className="text-xl">{a.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{a.nome}</p>
                    <p className="text-xs text-gray-500">{a.canal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-400">R$ {custo.brl.toFixed(2)}/mês</p>
                    <p className="text-[10px] text-gray-600">{a.estimativa.chamadas_mes} calls</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Em breve */}
        <div className="bg-[#16161f] border border-[#2a2a38] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Próximos Agentes</h2>
            <span className="ml-auto text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">{emBreve.length} planejados</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {emBreve.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 bg-[#1e1e2a] rounded-lg">
                <span className="text-lg">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{a.nome}</p>
                  <p className="text-[10px] text-gray-600">{a.sistema}</p>
                </div>
                <span className="text-[10px] bg-[#2a2a38] text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">{a.modelo.includes('haiku') ? 'Haiku' : 'Sonnet'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-[#16161f] border border-[#2a2a38] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Roadmap — 5 Sistemas</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { nome: 'CRM Comercial', fase: 1, status: 'ativo', agentes: 2, cor: 'bg-green-500' },
            { nome: 'Financeiro', fase: 2, status: 'breve', agentes: 2, cor: 'bg-blue-500' },
            { nome: 'Marketing', fase: 3, status: 'breve', agentes: 7, cor: 'bg-purple-500' },
            { nome: 'Logística', fase: 4, status: 'breve', agentes: 2, cor: 'bg-amber-500' },
            { nome: 'RH + Produção', fase: 5, status: 'breve', agentes: 2, cor: 'bg-pink-500' },
          ].map(s => (
            <div key={s.fase} className="bg-[#1e1e2a] rounded-lg p-3 text-center">
              <div className={clsx('w-2 h-2 rounded-full mx-auto mb-2', s.cor)} />
              <p className="text-xs font-medium text-white">Fase {s.fase}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.nome}</p>
              <p className="text-[10px] text-gray-600 mt-1">{s.agentes} agentes</p>
              <span className={clsx(
                'inline-block mt-2 text-[9px] px-2 py-0.5 rounded-full',
                s.status === 'ativo' ? 'bg-green-500/10 text-green-400' : 'bg-[#2a2a38] text-gray-500'
              )}>
                {s.status === 'ativo' ? '✓ ativo' : 'planejado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
