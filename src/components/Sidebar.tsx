import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Bot, BarChart3, MessageSquare, Shield, Flower2, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import clsx from 'clsx'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/agentes', label: 'Agentes', icon: Bot },
  { to: '/uso', label: 'Uso & Custos', icon: BarChart3 },
  { to: '/fiscal', label: 'Chat Fiscal', icon: MessageSquare },
  { to: '/logs', label: 'Segurança', icon: Shield },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col z-10" style={{ background: '#0e2955', borderRight: '1px solid #1a3d7a' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid #1a3d7a' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#8e2753' }}>
          <Flower2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">marijasmin</p>
          <p className="text-[10px] leading-tight" style={{ color: '#b03570' }}>OS · Agentes</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3">
        <p className="text-[10px] uppercase tracking-widest px-2 mb-2" style={{ color: '#4a6a9a' }}>Menu</p>
        <ul className="space-y-0.5">
          {LINKS.map(({ to, label, icon: Icon, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'font-medium text-white'
                      : 'text-blue-200 hover:text-white'
                  )
                }
                style={({ isActive }) => isActive ? { background: '#8e2753' } : {}}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid #1a3d7a' }}>
        <div className="px-2 mb-2">
          <p className="text-[10px]" style={{ color: '#4a6a9a' }}>Supabase: oovdayewoaeyaolzoesq</p>
          <p className="text-[10px]" style={{ color: '#4a6a9a' }}>v1.0.0 · Fase 1</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-blue-200 hover:text-red-300"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}
