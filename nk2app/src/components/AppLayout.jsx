import { useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Typography } from 'antd'
import { logout, isAdmin, isSuperAdmin, getRole, getUsername } from '../services/auth'

const { Text } = Typography

const hoy = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
})

const ADMINS = ['OtonielR', 'PatriciaN', 'EloisaG']

const NAV = [
  { to: '/',             label: '📝 Formularios',      color: '#1a5c2a', adminOnly: true  },
  { to: '/consulta',     label: '🔍 Consultas',         color: '#2d6a4f', adminOnly: true  },
  { to: '/informe',      label: '📊 Informe detallado', color: '#2c3e7a', adminOnly: false },
  { to: '/morosos',      label: '⚠ Mora',              color: '#7a1a1a', adminOnly: false },
  { to: '/abonos',       label: '💲 Abonos',            color: '#854f0b', adminOnly: true  },
  { to: '/informe-mensual', label: '📄 Informe general', color: '#2c5f8a', adminOnly: false },
  { to: '/reporte',      label: '📋 Rep. fechas',       color: '#5b3a8a', adminOnly: false },
  { to: '/usuarios',     label: '👥 Usuarios',          color: '#4a1a6a', adminOnly: true, superAdminOnly: true },
]

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '7px 13px',
  fontSize: 12,
  fontWeight: 500,
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'IBM Plex Sans, sans-serif',
  textDecoration: 'none',
  transition: 'opacity .15s',
  whiteSpace: 'nowrap',
  color: '#fff',
}

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const admin      = isAdmin()
  const superAdmin = isSuperAdmin()
  const role       = getRole()

  // ── Auto-cierre por inactividad ──────────────────────────────────────────
  useEffect(() => {
    const user    = getUsername()
    const minutos = ADMINS.includes(user) ? 6 : 3
    const T       = minutos * 60 * 1000
    let timer

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        logout()
        navigate('/login', { replace: true })
      }, T)
    }

    const eventos = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']
    eventos.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      clearTimeout(timer)
      eventos.forEach(e => window.removeEventListener(e, reset))
    }
  }, [])

  function cerrarSesion() {
    logout()
    navigate('/login', { replace: true })
  }

  const visibleNav = NAV.filter(n => {
    if (n.superAdminOnly) return superAdmin
    if (n.adminOnly)      return admin
    return true
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#808080' }}>

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
            <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Comité Ornato y Seguridad · NK2
            </Text>
          </Link>
          <Text style={{ display: 'block', color: '#888', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, marginTop: 2 }}>
            {hoy}
          </Text>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {visibleNav.map(n => {
            const active = location.pathname === n.to
            return (
              <button key={n.to} onClick={() => navigate(n.to)}
                style={{ ...btnBase, background: active ? n.color : 'transparent', border: `1px solid ${n.color}`, color: active ? '#fff' : n.color }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                {n.label}
              </button>
            )
          })}
          {role !== 'residente' && (
            <button onClick={() => navigate('/cambiar-clave')}
              style={{ ...btnBase, background: 'transparent', border: '1px solid #666', color: '#ccc' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              🔑 Mi clave
            </button>
          )}
          <button onClick={cerrarSesion}
            style={{ ...btnBase, background: '#4a4a4a', border: '1px solid #4a4a4a' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            🔒 Salir
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
