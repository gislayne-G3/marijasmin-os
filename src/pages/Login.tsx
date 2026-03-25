import { useState, FormEvent } from 'react'
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
    <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-600/30">
            <Flower2 size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Marijasmim OS</h1>
          <p className="text-sm text-gray-500 mt-1">Painel de Agentes & Operações</p>
        </div>

        {/* Card */}
        <div className="bg-[#16161f] border border-[#2a2a38] rounded-2xl p-7 shadow-xl">
          <h2 className="text-base font-semibold text-white mb-5">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-[#1e1e2a] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1e1e2a] border border-[#2a2a38] rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5">
          Acesso restrito · Marijasmim OS v1.0
        </p>
      </div>
    </div>
  )
}
