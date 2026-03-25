import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center">
        <Loader2 size={24} className="text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
