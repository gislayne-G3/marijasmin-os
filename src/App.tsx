import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agentes from './pages/Agentes'
import Uso from './pages/Uso'
import ChatFiscal from './pages/ChatFiscal'
import Logs from './pages/Logs'

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="agentes" element={<Agentes />} />
        <Route path="uso" element={<Uso />} />
        <Route path="fiscal" element={<ChatFiscal />} />
        <Route path="logs" element={<Logs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
