import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar     from './components/Sidebar'
import Dashboard   from './pages/Dashboard/Dashboard'
import Faturamento from './pages/Faturamento/Faturamento'
import Clientes    from './pages/Clientes/Clientes'
import Produtos    from './pages/Produtos/Produtos'
import './styles/global.css'
import styles from './App.module.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <Routes>
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/faturamento" element={<Faturamento />} />
            <Route path="/clientes"    element={<Clientes />} />
            <Route path="/produtos"    element={<Produtos />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}