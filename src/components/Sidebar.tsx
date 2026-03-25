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
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r border-[#2a2a38] bg-[#0c0c12] z-10">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#2a2a38]">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <Flower2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Marijasmim</p>
          <p className="text-[10px] text-purple-400 leading-tight">OS · Agentes</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3">
        <p className="text-[10px] uppercase tracking-widest text-gray-600 px-2 mb-2">Menu</p>
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
                      ? 'bg-purple-600/20 text-purple-300 font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#2a2a38] space-y-1">
        <div className="px-2 mb-2">
          <p className="text-[10px] text-gray-600">Supabase: oovdayewoaeyaolzoesq</p>
          <p className="text-[10px] text-gray-600">v1.0.0 · Fase 1</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}
