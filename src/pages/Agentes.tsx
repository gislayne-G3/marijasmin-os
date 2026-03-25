import { useState } from 'react'
import { AGENTES, estimarCustoMensal, custoTotalEcossistema } from '../lib/agents'

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
        <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>Agentes</h1>
        <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>
          {AGENTES.length} agentes planejados · Custo total estimado:{' '}
          <span className="font-medium" style={{ color: '#8e2753' }}>R$ {total.brl.toFixed(2)}/mês</span>
          <span style={{ color: '#9c8fa0' }}> (USD {total.usd.toFixed(4)})</span>
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1.5">
          {SISTEMAS.map(s => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={filtro === s
                ? { background: '#8e2753', color: '#ffffff', border: '1px solid #8e2753' }
                : { background: '#ffffff', color: '#6b5b6e', border: '1px solid #e8e4e8' }
              }
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSoAtivos(!soAtivos)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={soAtivos
            ? { background: 'rgba(45,140,78,0.1)', color: '#2d8c4e', border: '1px solid rgba(45,140,78,0.25)' }
            : { background: '#ffffff', color: '#6b5b6e', border: '1px solid #e8e4e8' }
          }
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
              className="rounded-xl p-5 flex flex-col gap-3 transition-all"
              style={{
                background: '#ffffff',
                border: `1px solid ${isAtivo ? 'rgba(142,39,83,0.25)' : '#e8e4e8'}`,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: isAtivo ? 'rgba(142,39,83,0.1)' : '#f7f5f5' }}
                  >
                    {agente.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#0e2955' }}>{agente.nome}</p>
                    <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{agente.sistema}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] px-2 py-1 rounded-full font-medium"
                  style={isAtivo
                    ? { background: 'rgba(45,140,78,0.1)', color: '#2d8c4e' }
                    : { background: '#f0eef0', color: '#9c8fa0' }
                  }
                >
                  {isAtivo ? '● ativo' : 'em breve'}
                </span>
              </div>

              {/* Desc */}
              <p className="text-xs leading-relaxed" style={{ color: '#6b5b6e' }}>{agente.descricao}</p>

              {/* Tags */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f0eef0', color: '#6b5b6e', border: '1px solid #e8e4e8' }}>
                  {agente.modelo.includes('haiku') ? 'Haiku' : 'Sonnet'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f0eef0', color: '#6b5b6e', border: '1px solid #e8e4e8' }}>
                  {agente.canal}
                </span>
              </div>

              {/* Custo */}
              <div className="mt-auto pt-3 flex items-center justify-between" style={{ borderTop: '1px solid #e8e4e8' }}>
                <div>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>Estimativa mensal</p>
                  <p className="text-sm font-bold" style={{ color: '#0e2955' }}>R$ {custo.brl.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{agente.estimativa.chamadas_mes.toLocaleString('pt-BR')} calls/mês</p>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>~{agente.estimativa.tokens_input_med} / {agente.estimativa.tokens_output_med} tokens</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
