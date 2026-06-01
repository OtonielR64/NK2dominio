import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import Login from './pages/Login'
import Formulario from './pages/Formulario'
import Consulta from './pages/Consulta'
import Abonos from './pages/Abonos'
import Informe from './pages/Informe'
import Morosos from './pages/Morosos'
import InformeMensual from './pages/InformeMensual'
import ReporteFiltro from './pages/ReporteFiltro'
import MiCuenta from './pages/MiCuenta'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'

function LayoutRoute({ children, adminOnly }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <ConfigProvider
      locale={esES}
      theme={{
        token: {
          colorPrimary: '#1a5c2a',
          borderRadius: 6,
          fontFamily: 'IBM Plex Sans, sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/login"     element={<Login />} />
          <Route path="/mi-cuenta" element={<MiCuenta />} />

          <Route path="/" element={
            <LayoutRoute adminOnly><Formulario /></LayoutRoute>
          } />
          <Route path="/consulta" element={
            <LayoutRoute adminOnly><Consulta /></LayoutRoute>
          } />
          <Route path="/abonos" element={
            <LayoutRoute adminOnly><Abonos /></LayoutRoute>
          } />
          <Route path="/morosos" element={
            <LayoutRoute><Morosos /></LayoutRoute>
          } />
          <Route path="/reporte" element={
            <LayoutRoute><ReporteFiltro /></LayoutRoute>
          } />
          <Route path="/informe-mensual" element={
            <LayoutRoute><InformeMensual /></LayoutRoute>
          } />
          <Route path="/informe" element={
            <LayoutRoute><Informe /></LayoutRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
