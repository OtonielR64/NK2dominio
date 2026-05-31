import { useNavigate, useLocation } from 'react-router-dom'

const LINKS = [
  { to: '/informe',         label: 'Informe Detallado' },
  { to: '/morosos',         label: 'Mora' },
  { to: '/informe-mensual', label: 'Informe General' },
  { to: '/reporte',         label: 'Reporte por Fechas' },
]

export default function InformesNav() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div className="no-print" style={{ background: '#fff', borderBottom: '1px solid #dddbd6', padding: '0 16px', display: 'flex', overflowX: 'auto' }}>
      {LINKS.map(l => {
        const active = location.pathname === l.to
        return (
          <button
            key={l.to}
            onClick={() => navigate(l.to)}
            style={{
              padding: '10px 16px',
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              color: active ? '#1a5c2a' : '#6b6b66',
              background: 'none',
              border: 'none',
              borderBottom: active ? '2px solid #1a5c2a' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}
          >
            {l.label}
          </button>
        )
      })}
    </div>
  )
}
