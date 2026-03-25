import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import clsx from 'clsx'

interface LogEntry {
  id: string
  agente: string
  tarefa: string | null
  sucesso: boolean
  custo_usd: number
  tokens_input: number
  tokens_output: number
  modelo: string
  created_at: string
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'erros'>('todos')

  useEffect(() => {
    async function load() {
      const q = supabase
        .from('agentes_uso')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filtro === 'erros') q.eq('sucesso', false)

      const { data } = await q
      if (data) setLogs(data as LogEntry[])
      setLoading(false)
    }
    load()
  }, [filtro])

  const erros = logs.filter(l => !l.sucesso).length
  const taxa = logs.length > 0 ? ((logs.length - erros) / logs.length * 100).toFixed(1) : '100.0'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>Segurança & Logs</h1>
        <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>Histórico completo de chamadas e status dos agentes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de chamadas', value: logs.length, icon: Clock, color: '#0e2955', bg: 'rgba(14,41,85,0.1)' },
          { label: 'Sucessos', value: logs.length - erros, icon: CheckCircle2, color: '#2d8c4e', bg: 'rgba(45,140,78,0.1)' },
          { label: 'Erros', value: erros, icon: AlertCircle, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
          { label: 'Taxa de sucesso', value: `${taxa}%`, icon: Shield, color: '#8e2753', bg: 'rgba(142,39,83,0.1)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs" style={{ color: '#9c8fa0' }}>{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                <Icon size={13} style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold" style={{ color: '#0e2955' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['todos', 'erros'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={filtro === f
              ? { background: '#8e2753', color: '#ffffff', border: '1px solid #8e2753' }
              : { background: '#ffffff', color: '#6b5b6e', border: '1px solid #e8e4e8' }
            }
          >
            {f === 'todos' ? 'Todos' : 'Só erros'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: '#9c8fa0' }}>Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Shield size={32} className="mx-auto mb-3" style={{ color: '#e8e4e8' }} />
            <p className="text-sm" style={{ color: '#9c8fa0' }}>Nenhuma chamada registrada ainda.</p>
            <p className="text-xs mt-1" style={{ color: '#9c8fa0' }}>Os logs aparecerão aqui quando os agentes fizerem chamadas à Claude API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e4e8' }}>
                  {['Status', 'Agente', 'Tarefa', 'Modelo', 'Tokens', 'Custo', 'Data/hora'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: '#9c8fa0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={clsx(!log.sucesso && 'bg-red-50')}
                    style={{ borderBottom: i === logs.length - 1 ? 'none' : '1px solid #e8e4e8' }}
                  >
                    <td className="px-4 py-3">
                      {log.sucesso
                        ? <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(45,140,78,0.1)' }}><CheckCircle2 size={12} style={{ color: '#2d8c4e' }} /></span>
                        : <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)' }}><AlertCircle size={12} style={{ color: '#dc2626' }} /></span>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#0e2955' }}>{log.agente}</td>
                    <td className="px-4 py-3 text-xs max-w-[180px] truncate" style={{ color: '#6b5b6e' }}>{log.tarefa || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#9c8fa0' }}>{log.modelo.includes('haiku') ? 'Haiku' : 'Sonnet'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6b5b6e' }}>{(log.tokens_input + log.tokens_output).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#0e2955' }}>R$ {(Number(log.custo_usd) * 5.8).toFixed(6)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#9c8fa0' }}>
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
