import { Link } from 'react-router-dom'
import { Bot, Wrench, Scale, ArrowRight } from 'lucide-react'

const CARDS = [
  {
    to: '/custos/agentes',
    label: 'Custos por Agente',
    descricao: 'Quanto cada agente IA custa por mês em tokens, com cálculo a partir do uso real.',
    icon: Bot,
    cor: '#8e2753',
  },
  {
    to: '/custos/ferramentas',
    label: 'Custos por Ferramenta',
    descricao: 'Vercel, Railway, Tiny, WBuy, Meta Ads, Canva e demais SaaS do ecossistema.',
    icon: Wrench,
    cor: '#0e2955',
  },
  {
    to: '/custos/comparativo',
    label: 'Comparativo Humano vs IA',
    descricao: 'Quanto custaria uma equipe humana equivalente vs o ecossistema atual. ROI em tempo real.',
    icon: Scale,
    cor: '#2d8c4e',
  },
]

export default function CustosIndex() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0e2955' }}>Custos</h1>
        <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>
          Painel de custos do ecossistema marijasmin — tokens, ferramentas e ROI
        </p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {CARDS.map(({ to, label, descricao, icon: Icon, cor }) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl p-6 transition-all hover:-translate-y-0.5"
            style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${cor}1a` }}
            >
              <Icon size={18} style={{ color: cor }} />
            </div>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#0e2955' }}>
              {label}
            </h2>
            <p className="text-xs leading-relaxed mb-4" style={{ color: '#6b5b6e' }}>
              {descricao}
            </p>
            <div className="flex items-center gap-1 text-xs font-medium" style={{ color: cor }}>
              Abrir
              <ArrowRight size={13} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
