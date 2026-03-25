import { useState } from 'react'
import { AGENTES, estimarCustoMensal, custoTotalEcossistema } from '../lib/agents'
import clsx from 'clsx'

const SISTEMAS = ['Todos', 'CRM', 'OS', 'Financeiro', 'Marketing', 'Logística', 'RH']

export default function Agentes() {
  const [filtro, setFiltro] = useState('Todos')
  const [soAtivos, setSoAtivos] = useState(false)

  const lista = AGENTES.filter(a => {
    if (soAtivos && a.status !== 'ativo') return false
    if (filtro !== 'Todos' && a.sistema !== filtro) return false
    return true
  })

  const total = custoTotalEcossistema()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Agentes</h1>
        <p className="text-gray-400 text-sm mt-1">
          {AGENTES.length} agentes planejados · Custo total estimado:{' '}
          <span className="text-purple-400 font-medium">R$ {total.brl.toFixed(2)}/mês</span>
          <span className="text-gray-600"> (USD {total.usd.toFixed(4)})</span>
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1.5">
          {SISTEMAS.map(s => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filtro === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#1e1e2a] text-gray-400 hover:text-gray-200 border border-[#2a2a38]'
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSoAtivos(!soAtivos)}
          className={clsx(
            'ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
            soAtivos
              ? 'bg-green-500/10 text-green-400 border-green-500/30'
              : 'bg-[#1e1e2a] text-gray-400 border-[#2a2a38]'
          )}
        >
          {soAtivos ? '✓ Só ativos' : 'Só ativos'}
        </button>
      </div>

      {/* Grid de agentes */}
      <div className="grid grid-cols-3 gap-4">
        {lista.map(agente => {
          const custo = estimarCustoMensal(agente)
          const isAtivo = agente.status === 'ativo'

          return (
            <div
              key={agente.id}
              className={clsx(
                'bg-[#16161f] border rounded-xl p-5 flex flex-col gap-3 transition-all',
                isAtivo ? 'border-purple-500/30' : 'border-[#2a2a38]'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                    isAtivo ? 'bg-purple-500/15' : 'bg-[#1e1e2a]'
                  )}>
                    {agente.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{agente.nome}</p>
                    <p className="text-[10px] text-gray-500">{agente.sistema}</p>
                  </div>
                </div>
                <span className={clsx(
                  'text-[10px] px-2 py-1 rounded-full font-medium',
                  isAtivo
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-[#1e1e2a] text-gray-500'
                )}>
                  {isAtivo ? '● ativo' : 'em breve'}
                </span>
              </div>

              {/* Desc */}
              <p className="text-xs text-gray-400 leading-relaxed">{agente.descricao}</p>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] bg-[#1e1e2a] text-gray-500 px-2 py-0.5 rounded-full border border-[#2a2a38]">
                  {agente.modelo.includes('haiku') ? 'Haiku' : 'Sonnet'}
                </span>
                <span className="text-[10px] bg-[#1e1e2a] text-gray-500 px-2 py-0.5 rounded-full border border-[#2a2a38]">
                  {agente.canal}
                </span>
              </div>

              {/* Custo */}
              <div className="mt-auto pt-3 border-t border-[#2a2a38] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-600">Estimativa mensal</p>
                  <p className="text-sm font-bold text-white">R$ {custo.brl.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-600">{agente.estimativa.chamadas_mes.toLocaleString('pt-BR')} calls/mês</p>
                  <p className="text-[10px] text-gray-600">~{agente.estimativa.tokens_input_med} / {agente.estimativa.tokens_output_med} tokens</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
