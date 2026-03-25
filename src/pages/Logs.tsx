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
        <h1 className="text-2xl font-bold text-white">Segurança & Logs</h1>
        <p className="text-gray-400 text-sm mt-1">Histórico completo de chamadas e status dos agentes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de chamadas', value: logs.length, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Sucessos', value: logs.length - erros, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Erros', value: erros, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Taxa de sucesso', value: `${taxa}%`, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#16161f] border border-[#2a2a38] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">{label}</p>
              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', bg)}>
                <Icon size={13} className={color} />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['todos', 'erros'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              filtro === f
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-[#1e1e2a] text-gray-400 border-[#2a2a38] hover:text-gray-200'
            )}
          >
            {f === 'todos' ? 'Todos' : 'Só erros'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#16161f] border border-[#2a2a38] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <Shield size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma chamada registrada ainda.</p>
            <p className="text-gray-600 text-xs mt-1">Os logs aparecerão aqui quando os agentes fizerem chamadas à Claude API.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a38]">
                  {['Status', 'Agente', 'Tarefa', 'Modelo', 'Tokens', 'Custo', 'Data/hora'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className={clsx(
                      'border-b border-[#2a2a38] hover:bg-white/[0.02]',
                      i === logs.length - 1 && 'border-0',
                      !log.sucesso && 'bg-red-500/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      {log.sucesso
                        ? <span className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center"><CheckCircle2 size={12} className="text-green-400" /></span>
                        : <span className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center"><AlertCircle size={12} className="text-red-400" /></span>
                      }
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{log.agente}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[180px] truncate">{log.tarefa || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.modelo.includes('haiku') ? 'Haiku' : 'Sonnet'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{(log.tokens_input + log.tokens_output).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">R$ {(Number(log.custo_usd) * 5.8).toFixed(6)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
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
