import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button, Space, Typography, Tooltip } from 'antd'
import {
  SearchOutlined, BarChartOutlined, WarningOutlined,
  DollarOutlined, FileTextOutlined, FilterOutlined, LogoutOutlined
} from '@ant-design/icons'
import { logout, isAdmin } from '../services/auth'

const { Text } = Typography

const hoy = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
})

const NAV = [
  { to: '/consulta',        label: 'Consultas',        icon: <SearchOutlined />,      color: '#2d6a4f', adminOnly: true },
  { to: '/informe',         label: 'Inf. detallado',   icon: <BarChartOutlined />,    color: '#2c3e7a', adminOnly: false },
  { to: '/morosos',         label: 'Mora',             icon: <WarningOutlined />,     color: '#7a1a1a', adminOnly: true },
  { to: '/abonos',          label: 'Abonos',           icon: <DollarOutlined />,      color: '#854f0b', adminOnly: true },
  { to: '/informe-mensual', label: 'Inf. general',     icon: <FileTextOutlined />,    color: '#2c5f8a', adminOnly: true },
  { to: '/reporte',         label: 'Rep. fechas',      icon: <FilterOutlined />,      color: '#5b3a8a', adminOnly: true },
]

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = isAdmin()

  function cerrarSesion() {
    logout()
    navigate('/login', { replace: true })
  }

  const visibleNav = NAV.filter(n => !n.adminOnly || admin)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f3f0' }}>
      {/* HEADER */}
      <div className="no-print" style={{
        background: '#1a1a18',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Text style={{
              color: '#fff',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}>
              Comité Ornato y Seguridad · NK2
            </Text>
          </Link>
          <Text style={{
            display: 'block',
            color: '#888',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 10,
            marginTop: 2,
          }}>
            {hoy}
          </Text>
        </div>

        <Space wrap size={6}>
          {visibleNav.map(n => (
            <Tooltip key={n.to} title={n.label}>
              <Button
                size="small"
                icon={n.icon}
                onClick={() => navigate(n.to)}
                style={{
                  background: location.pathname === n.to ? n.color : 'transparent',
                  borderColor: n.color,
                  color: location.pathname === n.to ? '#fff' : n.color,
                  fontSize: 11,
                }}
              >
                <span style={{ display: 'none' }} className="nav-label">{n.label}</span>
              </Button>
            </Tooltip>
          ))}
          <Button
            size="small"
            icon={<LogoutOutlined />}
            onClick={cerrarSesion}
            style={{ background: '#4a4a4a', borderColor: '#4a4a4a', color: '#fff', fontSize: 11 }}
          >
            Salir
          </Button>
        </Space>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}
