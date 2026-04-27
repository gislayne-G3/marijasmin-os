import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, AlertCircle, Pause } from 'lucide-react'

type AgentStatus = {
  agent_name: string
  display_name: string | null
  avatar_emoji: string | null
  category: string | null
  status: 'idle' | 'working' | 'sleeping' | 'error' | 'offline'
  current_task: string | null
  last_action_at: string | null
  custo_dia_usd: number
  custo_mes_usd: number
  total_calls_24h: number
  total_calls_30d: number
  cor_primaria: string | null
  active: boolean
  metadata: any
}

type WorkflowStatus = {
  workflow_id: string
  name: string
  active: boolean
  last_status: string | null
  error_rate_2h: number
  errors_24h: number
}

type CustoAgg = {
  agent_name: string
  workflow: string | null
  total_24h: number
  total_30d: number
  custo_24h_usd: number
  custo_30d_usd: number
}

function formatBRL(usd: number): string {
  return (usd * 5.8).toFixed(2)
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function statusBadge(status: AgentStatus['status'], wfStatus: WorkflowStatus | null) {
  if (wfStatus && wfStatus.error_rate_2h >= 100 && wfStatus.errors_24h > 5) {
    return { label: 'erro crítico', color: '#dc2626', bg: '#fef2f2', icon: AlertCircle }
  }
  if (status === 'offline') return { label: 'desligado', color: '#9ca3af', bg: '#f3f4f6', icon: Pause }
  if (status === 'error') return { label: 'erro', color: '#f97316', bg: '#fff7ed', icon: AlertCircle }
  if (status === 'working') return { label: 'trabalhando', color: '#2563eb', bg: '#eff6ff', icon: Activity }
  if (status === 'sleeping') return { label: 'dormindo', color: '#9ca3af', bg: '#f3f4f6', icon: Pause }
  return { label: 'pronto', color: '#10b981', bg: '#f0fdf4', icon: Activity }
}

export default function AgentesEmProducao() {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [workflows, setWorkflows] = useState<Record<string, WorkflowStatus>>({})
  const [custos, setCustos] = useState<Record<string, CustoAgg>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const [agentsRes, wfsRes, usageRes] = await Promise.all([
      supabase.from('os_agents_status').select('*').eq('active', true).order('agent_name'),
      supabase.from('os_workflow_status').select('workflow_id,name,active,last_status,error_rate_2h,errors_24h'),
      supabase
        .from('agent_usage_log')
        .select('agent_name,custo_usd,timestamp,meta')
        .gte('timestamp', new Date(Date.now() - 30 * 86400 * 1000).toISOString())
        .limit(20000),
    ])

    setAgents((agentsRes.data as AgentStatus[]) ?? [])

    const wfMap: Record<string, WorkflowStatus> = {}
    for (const w of ((wfsRes.data as WorkflowStatus[]) ?? [])) {
      wfMap[w.workflow_id] = w
    }
    setWorkflows(wfMap)

    // Agregação local de custos por agent_name + workflow (do meta)
    const costMap: Record<string, CustoAgg> = {}
    const since24h = Date.now() - 24 * 3600 * 1000
    for (const row of (usageRes.data ?? [])) {
      const wfMeta: string = (row as any).meta?.workflow ?? ''
      const tipo: string = (row as any).meta?.tipo ?? ''
      const key = wfMeta ? `${row.agent_name}|${wfMeta}${tipo ? '_' + tipo : ''}` : row.agent_name
      if (!costMap[key]) {
        costMap[key] = { agent_name: row.agent_name, workflow: wfMeta || null, total_24h: 0, total_30d: 0, custo_24h_usd: 0, custo_30d_usd: 0 }
      }
      const c = costMap[key]
      const usd = Number(row.custo_usd) || 0
      const ts = new Date(row.timestamp).getTime()
      c.total_30d += 1
      c.custo_30d_usd += usd
      if (ts >= since24h) {
        c.total_24h += 1
        c.custo_24h_usd += usd
      }
    }
    setCustos(costMap)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase
      .channel('os-agentes-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'os_agents_status' }, () => load())
      .subscribe()
    const interval = setInterval(load, 60000)
    return () => {
      supabase.removeChannel(ch)
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return <div className="text-sm text-gray-500 mb-6">Carregando agentes em produção…</div>
  }

  // Match agent → custos por agent_name (também tenta meta.workflow.startsWith)
  function getCusto(agent: AgentStatus): CustoAgg {
    const key = agent.agent_name
    if (custos[key]) return custos[key]
    // Fallback: somar tudo que começa com o agent_name (caso meta varie)
    let acc: CustoAgg = { agent_name: key, workflow: null, total_24h: 0, total_30d: 0, custo_24h_usd: 0, custo_30d_usd: 0 }
    for (const k of Object.keys(custos)) {
      if (k.startsWith(key) || k === key) {
        acc.total_24h += custos[k].total_24h
        acc.total_30d += custos[k].total_30d
        acc.custo_24h_usd += custos[k].custo_24h_usd
        acc.custo_30d_usd += custos[k].custo_30d_usd
      }
    }
    return acc
  }

  if (agents.length === 0) return null

  const totalDia = agents.reduce((s, a) => s + getCusto(a).custo_24h_usd, 0)
  const totalMes = agents.reduce((s, a) => s + getCusto(a).custo_30d_usd, 0)

  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: '#0e2955' }}>Em produção</h2>
        <p className="text-xs" style={{ color: '#9c8fa0' }}>
          Hoje: <span className="font-semibold" style={{ color: '#8e2753' }}>R$ {formatBRL(totalDia)}</span>
          {' · '}
          30d: <span className="font-semibold" style={{ color: '#8e2753' }}>R$ {formatBRL(totalMes)}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {agents.map((a) => {
          const wfId = a.metadata?.workflow_id
          const wf = wfId ? workflows[wfId] : null
          const badge = statusBadge(a.status, wf)
          const custo = getCusto(a)
          const Icon = badge.icon
          return (
            <div
              key={a.agent_name}
              className="rounded-xl p-4 bg-white border"
              style={{ borderColor: a.status === 'offline' ? '#e5e7eb' : 'rgba(142,39,83,0.18)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: a.status === 'offline' ? '#f3f4f6' : 'rgba(142,39,83,0.08)' }}
                  >
                    {a.avatar_emoji ?? '🤖'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0e2955' }}>
                      {a.display_name ?? a.agent_name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#9c8fa0' }}>
                      {a.category ?? ''}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 whitespace-nowrap"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  <Icon size={10} />
                  {badge.label}
                </span>
              </div>

              {/* Workflow link */}
              {wf && (
                <div className="mb-2 text-[11px] truncate" style={{ color: '#6b5b6e' }}>
                  <span className="opacity-60">workflow:</span> {wf.name}
                  {wf.error_rate_2h > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[9px]" style={{ background: '#fef2f2', color: '#dc2626' }}>
                      {wf.error_rate_2h.toFixed(0)}% erro 2h
                    </span>
                  )}
                </div>
              )}

              {a.metadata?.motivo_offline && (
                <div className="mb-2 text-[11px] italic" style={{ color: '#9c8fa0' }}>
                  {a.metadata.motivo_offline}
                </div>
              )}

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid #f0eef0' }}>
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9c8fa0' }}>Hoje</p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: '#0e2955' }}>
                    R$ {formatBRL(custo.custo_24h_usd)}
                  </p>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{custo.total_24h} calls</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9c8fa0' }}>30d</p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: '#0e2955' }}>
                    R$ {formatBRL(custo.custo_30d_usd)}
                  </p>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{custo.total_30d} calls</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: '#9c8fa0' }}>Última ação</p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: '#0e2955' }}>
                    {timeAgo(a.last_action_at)}
                  </p>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>
                    {a.status === 'offline' ? 'parada' : 'atrás'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
