import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Wrench, Server, Cpu, Users, Megaphone, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface ToolCost {
  id: string
  ferramenta: string
  categoria: 'infra' | 'ia' | 'pessoas' | 'marketing' | 'plataforma' | string
  tipo: 'fixo' | 'variavel'
  custo_brl: number
  observacao: string | null
  ativo: boolean
}

const CATEGORIA_META: Record<string, { label: string; cor: string; icon: typeof Server }> = {
  infra:      { label: 'Infra',         cor: '#0e2955', icon: Server },
  ia:         { label: 'IA',            cor: '#8e2753', icon: Cpu },
  pessoas:    { label: 'Pessoas',       cor: '#b45309', icon: Users },
  marketing:  { label: 'Marketing',     cor: '#7c3aed', icon: Megaphone },
  plataforma: { label: 'Plataforma',    cor: '#2d8c4e', icon: Package },
}

export default function CustosFerramentas() {
  const [items, setItems] = useState<ToolCost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data } = await supabase
        .from('tool_costs')
        .select('*')
        .eq('ativo', true)
        .order('custo_brl', { ascending: false })
      if (mounted && data) setItems(data as ToolCost[])
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const porCategoria = useMemo(() => {
    const map: Record<string, { itens: ToolCost[]; total: number }> = {}
    for (const i of items) {
      const cat = i.categoria || 'plataforma'
      if (!map[cat]) map[cat] = { itens: [], total: 0 }
      map[cat].itens.push(i)
      map[cat].total += Number(i.custo_brl)
    }
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
  }, [items])

  const totalGeral = items.reduce((s, i) => s + Number(i.custo_brl), 0)
  const totalFixo = items.filter((i) => i.tipo === 'fixo').reduce((s, i) => s + Number(i.custo_brl), 0)
  const totalVariavel = items.filter((i) => i.tipo === 'variavel').reduce((s, i) => s + Number(i.custo_brl), 0)

  return (
    <div className="p-8">
      <Link to="/custos" className="inline-flex items-center gap-1 text-xs mb-4" style={{ color: '#6b5b6e' }}>
        <ArrowLeft size={13} /> Custos
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>Custos por Ferramenta</h1>
        <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>
          SaaS, infra, plataformas e equipe — gerenciado em <code>tool_costs</code>
        </p>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total mensal" value={`R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub={`${items.length} ferramentas`} cor="#0e2955" />
        <SummaryCard label="Custos fixos" value={`R$ ${totalFixo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="recorrentes" cor="#2d8c4e" />
        <SummaryCard label="Variáveis (estimativa)" value={`R$ ${totalVariavel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="ads, IA, etc" cor="#b45309" />
      </div>

      {/* Por categoria */}
      <div className="space-y-5">
        {porCategoria.map(([cat, { itens, total }]) => {
          const meta = CATEGORIA_META[cat] || { label: cat, cor: '#6b5b6e', icon: Wrench }
          const Icon = meta.icon
          const pct = totalGeral > 0 ? (total / totalGeral) * 100 : 0
          return (
            <div key={cat} className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e8e4e8', background: `${meta.cor}08` }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${meta.cor}1a` }}>
                    <Icon size={14} style={{ color: meta.cor }} />
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: '#0e2955' }}>{meta.label}</h2>
                  <span className="text-[10px]" style={{ color: '#9c8fa0' }}>· {itens.length} ferramentas</span>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold" style={{ color: meta.cor }}>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px]" style={{ color: '#9c8fa0' }}>{pct.toFixed(1)}% do total</p>
                </div>
              </div>
              <div>
                {itens.map((it, i) => (
                  <div key={it.id} className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: i === itens.length - 1 ? 'none' : '1px solid #f0eef0' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium" style={{ color: '#0e2955' }}>{it.ferramenta}</p>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase"
                          style={
                            it.tipo === 'fixo'
                              ? { background: 'rgba(45,140,78,0.1)', color: '#2d8c4e' }
                              : { background: 'rgba(180,83,9,0.1)', color: '#b45309' }
                          }
                        >
                          {it.tipo}
                        </span>
                      </div>
                      {it.observacao && (
                        <p className="text-[10px] mt-0.5" style={{ color: '#9c8fa0' }}>{it.observacao}</p>
                      )}
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#0e2955' }}>R$ {Number(it.custo_brl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {loading && <p className="text-xs text-center mt-4" style={{ color: '#9c8fa0' }}>carregando...</p>}

      {!loading && items.length === 0 && (
        <div className="rounded-xl p-12 text-center" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
          <p className="text-sm" style={{ color: '#9c8fa0' }}>
            Nenhuma ferramenta cadastrada. Rode o SQL <code>sql/custos-modulo.sql</code> no Supabase para popular a tabela inicial.
          </p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, sub, cor }: { label: string; value: string; sub: string; cor: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
      <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: '#9c8fa0' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: cor }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: '#9c8fa0' }}>{sub}</p>
    </div>
  )
}
