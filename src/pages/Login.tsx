import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Flower2, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Email ou senha incorretos.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f7f5f5' }}>
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(142,39,83,0.07)' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ background: '#8e2753', boxShadow: '0 8px 24px rgba(142,39,83,0.25)' }}>
            <Flower2 size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#0e2955' }}>marijasmin OS</h1>
          <p className="text-sm mt-1" style={{ color: '#6b5b6e' }}>Painel de Agentes & Operações</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7 shadow-xl" style={{ background: '#ffffff', border: '1px solid #e8e4e8' }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: '#0e2955' }}>Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#6b5b6e' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors"
                style={{ background: '#f7f5f5', border: '1px solid #e8e4e8', color: '#0e2955' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#8e2753')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e8e4e8')}
              />
            </div>

            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#6b5b6e' }}>Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors pr-10"
                  style={{ background: '#f7f5f5', border: '1px solid #e8e4e8', color: '#0e2955' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#8e2753')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e8e4e8')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9c8fa0' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs rounded-lg px-3 py-2" style={{ color: '#dc2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              style={{ background: '#8e2753' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = '#6b1d3e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#8e2753')}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#9c8fa0' }}>
          Acesso restrito · marijasmin OS v1.0
        </p>
      </div>
    </div>
  )
}
