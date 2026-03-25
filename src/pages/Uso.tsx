import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'

interface ResumoAgente {
  agente: string
  modelo: string
  total_chamadas: number
  total_tokens_input: number
  total_tokens_output: number
  total_tokens: number
  custo_total_usd: number
  custo_total_brl: number
  ultima_atividade: string
  custo_mes_usd: number
  custo_mes_brl: number
  chamadas_mes: number
}

interface UsoDiario {
  dia: string
  agente: string
  custo_dia_usd: number
  custo_dia_brl: number
  tokens_dia: number
  chamadas: number
}

const AGENTE_EMOJI: Record<string, string> = {
  mari_sdr: '💬',
  pix_ocr: '📸',
  links_pagarme: '🔗',
  agente_fiscal: '🔍',
  financeiro_estrategista: '💰',
  default: '🤖',
}

function emoji(id: string) {
  return AGENTE_EMOJI[id] || AGENTE_EMOJI.default
}

export default function Uso() {
  const [resumo, setResumo] = useState<ResumoAgente[]>([])
  const [diario, setDiario] = useState<UsoDiario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [r1, r2] = await Promise.all([
        supabase.from('agentes_resumo').select('*'),
        supabase.from('agentes_uso_diario').select('*').limit(60),
      ])
      if (r1.data) setResumo(r1.data as ResumoAgente[])
      if (r2.data) setDiario(r2.data as UsoDiario[])
      setLoading(false)
    }
    load()
  }, [])

  const totalBrl = resumo.reduce((s, r) => s + Number(r.custo_mes_brl), 0)
  const totalChamadas = resumo.reduce((s, r) => s + Number(r.chamadas_mes), 0)
  const totalTokens = resumo.reduce((s, r) => s + Number(r.total_tokens), 0)

  // group diario by date for simple bar chart
  const diasMap: Record<string, number> = {}
  diario.forEach(d => {
    diasMap[d.dia] = (diasMap[d.dia] || 0) + Number(d.custo_dia_brl)
  })
  const dias = Object.entries(diasMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
  const maxBrl = Math.max(...dias.map(d => d[1]), 0.001)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando dados de uso...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Uso & Custos</h1>
        <p className="text-gray-400 text-sm mt-1">Rastreio em tempo real de tokens e custos por agente</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Custo mês atual', value: `R$ ${totalBrl.toFixed(4)}`, sub: 'todos os agentes' },
          { label: 'Chamadas mês atual', value: totalChamadas.toLocaleString('pt-BR'), sub: 'requisições Claude API' },
          { label: 'Total de tokens', value: totalTokens.toLocaleString('pt-BR'), sub: 'acumulado histórico' },
        ].map(card => (
          <div key={card.label} className="bg-[#16161f] border border-[#2a2a38] rounded-xl p-5">
            <p className="text-xs text-gray-500 mb-2">{card.label}</p>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-600 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart — last 14 days */}
      <div className="bg-[#16161f] border border-[#2a2a38] rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Custo diário — últimos 14 dias (R$)</h2>
        {dias.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Sem dados ainda. Os custos aparecerão aqui após as primeiras chamadas.</p>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {dias.map(([dia, val]) => (
              <div key={dia} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[9px] text-gray-500">{val.toFixed(3)}</p>
                <div
                  className="w-full bg-purple-600/70 rounded-t-sm transition-all hover:bg-purple-500"
                  style={{ height: `${Math.max((val / maxBrl) * 100, 4)}%` }}
                  title={`${dia}: R$ ${val.toFixed(4)}`}
                />
                <p className="text-[8px] text-gray-600 rotate-45 origin-left translate-x-1">
                  {dia.slice(5)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-agent table */}
      <div className="bg-[#16161f] border border-[#2a2a38] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a38]">
          <h2 className="text-sm font-semibold text-white">Resumo por agente</h2>
        </div>
        {resumo.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-500 text-sm">Nenhum dado registrado ainda.</p>
            <p className="text-gray-600 text-xs mt-1">Os dados aparecerão quando os agentes começarem a ser chamados.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a38]">
                {['Agente', 'Modelo', 'Calls/mês', 'Tokens', 'Custo mês', 'Custo total', 'Última atividade'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resumo.map((r, i) => (
                <tr
                  key={r.agente}
                  className={clsx('border-b border-[#2a2a38] hover:bg-white/[0.02]', i === resumo.length - 1 && 'border-0')}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span>{emoji(r.agente)}</span>
                      <span className="text-white font-medium">{r.agente}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{r.modelo.includes('haiku') ? 'Haiku' : 'Sonnet'}</td>
                  <td className="px-5 py-3 text-gray-300">{Number(r.chamadas_mes).toLocaleString('pt-BR')}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{Number(r.total_tokens).toLocaleString('pt-BR')}</td>
                  <td className="px-5 py-3 text-green-400 font-medium">R$ {Number(r.custo_mes_brl).toFixed(4)}</td>
                  <td className="px-5 py-3 text-gray-300">R$ {Number(r.custo_total_brl).toFixed(4)}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {r.ultima_atividade ? new Date(r.ultima_atividade).toLocaleString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
