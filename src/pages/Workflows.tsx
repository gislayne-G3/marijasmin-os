import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw, Eye, EyeOff } from 'lucide-react'
import clsx from 'clsx'

type WorkflowStatus = {
  workflow_id: string
  name: string
  active: boolean
  last_exec_at: string | null
  last_status: string | null
  last_error_msg: string | null
  last_error_node: string | null
  total_24h: number
  errors_24h: number
  errors_2h: number
  total_2h: number
  error_rate_2h: number
  is_zombie: boolean
  expected_interval_min: number | null
  updated_at: string
}

type Alert = {
  id: string
  source: string
  source_id: string
  severity: 'info' | 'warn' | 'error' | 'critical'
  title: string
  message: string | null
  acknowledged: boolean
  created_at: string
}

function severity(wf: WorkflowStatus): 'critical' | 'error' | 'warn' | 'ok' {
  if (wf.error_rate_2h >= 100 && wf.total_2h >= 3) return 'critical'
  if (wf.error_rate_2h >= 50 && wf.total_2h >= 4) return 'error'
  if (wf.is_zombie || (wf.errors_24h > 0 && wf.total_24h <= 5)) return 'warn'
  return 'ok'
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'NUNCA'
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return `${Math.floor(diff)}s atrás`
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [hideOk, setHideOk] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    const [{ data: wfs }, { data: als }] = await Promise.all([
      supabase
        .from('os_workflow_status')
        .select('*')
        .eq('active', true)
        .order('error_rate_2h', { ascending: false })
        .order('errors_24h', { ascending: false })
        .order('name'),
      supabase
        .from('os_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ])
    setWorkflows((wfs as WorkflowStatus[]) ?? [])
    setAlerts((als as Alert[]) ?? [])
    setLoading(false)
  }

  async function ackAlert(id: string) {
    await supabase.from('os_alerts').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', id)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  async function forceRefresh() {
    setRefreshing(true)
    await supabase.rpc('fn_run_os_watchdog').catch(() => {})
    setTimeout(async () => {
      await load()
      setRefreshing(false)
    }, 8000)
  }

  useEffect(() => {
    load()
    const ch = supabase
      .channel('os-watchdog-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'os_workflow_status' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'os_alerts' }, () => load())
      .subscribe()
    const interval = setInterval(load, 30000)
    return () => {
      supabase.removeChannel(ch)
      clearInterval(interval)
    }
  }, [])

  const counts = workflows.reduce(
    (acc, w) => {
      const s = severity(w)
      acc[s] = (acc[s] || 0) + 1
      acc.total++
      return acc
    },
    { critical: 0, error: 0, warn: 0, ok: 0, total: 0 } as Record<string, number>,
  )

  const visibleWfs = hideOk ? workflows.filter((w) => severity(w) !== 'ok') : workflows

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando watchdog…</div>
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#0e2955' }}>
            Watchdog Workflows
          </h1>
          <p className="text-sm text-gray-500">
            Monitoramento em tempo real dos workflows n8n · Atualiza a cada 5min
          </p>
        </div>
        <button
          onClick={forceRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ background: '#8e2753' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Atualizando…' : 'Forçar atualização'}
        </button>
      </div>

      {/* Resumo cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <SummaryCard label="Total ativos" value={counts.total} color="#0e2955" />
        <SummaryCard label="Saudáveis" value={counts.ok} color="#10b981" icon={<CheckCircle2 size={18} />} />
        <SummaryCard label="Atenção" value={counts.warn} color="#f59e0b" icon={<Clock size={18} />} />
        <SummaryCard label="Erro" value={counts.error} color="#f97316" icon={<AlertTriangle size={18} />} />
        <SummaryCard label="Crítico" value={counts.critical} color="#dc2626" icon={<XCircle size={18} />} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-2">
            Alertas ativos · {alerts.length}
          </h2>
          <div className="space-y-2">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} onAck={() => ackAlert(a.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
          Workflows · {visibleWfs.length}/{counts.total}
        </h2>
        <button
          onClick={() => setHideOk(!hideOk)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
        >
          {hideOk ? <Eye size={14} /> : <EyeOff size={14} />}
          {hideOk ? 'Mostrar saudáveis' : 'Esconder saudáveis'}
        </button>
      </div>

      {/* Lista workflows */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {visibleWfs.map((w, i) => (
          <WorkflowRow key={w.workflow_id} wf={w} isLast={i === visibleWfs.length - 1} />
        ))}
        {visibleWfs.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            Tudo verde 🌿 · Nenhum workflow com problema
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-semibold" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

function AlertCard({ alert, onAck }: { alert: Alert; onAck: () => void }) {
  const colors = {
    critical: { bg: '#fef2f2', border: '#dc2626', text: '#7f1d1d' },
    error: { bg: '#fff7ed', border: '#f97316', text: '#7c2d12' },
    warn: { bg: '#fffbeb', border: '#f59e0b', text: '#78350f' },
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e3a8a' },
  }[alert.severity]
  return (
    <div
      className="rounded-lg border-l-4 p-3 flex items-start justify-between gap-3"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: colors.text }}>
          {alert.title}
        </div>
        {alert.message && (
          <div className="text-xs mt-1 opacity-80" style={{ color: colors.text }}>
            {alert.message}
          </div>
        )}
        <div className="text-[10px] mt-1 opacity-60" style={{ color: colors.text }}>
          {timeAgo(alert.created_at)}
        </div>
      </div>
      <button
        onClick={onAck}
        className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 whitespace-nowrap"
      >
        Reconhecer
      </button>
    </div>
  )
}

function WorkflowRow({ wf, isLast }: { wf: WorkflowStatus; isLast: boolean }) {
  const sev = severity(wf)
  const dot = {
    critical: '#dc2626',
    error: '#f97316',
    warn: '#f59e0b',
    ok: '#10b981',
  }[sev]
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-3', !isLast && 'border-b border-gray-100')}>
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dot }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{wf.name}</div>
        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
          <span>Última: {timeAgo(wf.last_exec_at)}</span>
          {wf.expected_interval_min && (
            <span className="opacity-70">cron {wf.expected_interval_min}min</span>
          )}
          <span>{wf.total_24h} execs/24h</span>
          {wf.errors_24h > 0 && (
            <span className="text-red-600 font-medium">{wf.errors_24h} erros</span>
          )}
        </div>
        {wf.last_error_msg && sev !== 'ok' && (
          <div className="text-xs text-red-700 mt-1 truncate">
            <span className="opacity-70">{wf.last_error_node}:</span> {wf.last_error_msg}
          </div>
        )}
      </div>
      {wf.is_zombie && (
        <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium uppercase">
          zumbi
        </span>
      )}
      {sev !== 'ok' && (
        <span className="text-xs font-semibold tabular-nums" style={{ color: dot }}>
          {wf.error_rate_2h.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
