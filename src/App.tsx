import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Agentes from './pages/Agentes'
import Uso from './pages/Uso'
import ChatFiscal from './pages/ChatFiscal'
import Logs from './pages/Logs'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="agentes" element={<Agentes />} />
          <Route path="uso" element={<Uso />} />
          <Route path="fiscal" element={<ChatFiscal />} />
          <Route path="logs" element={<Logs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
