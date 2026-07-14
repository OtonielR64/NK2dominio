import { Navigate, useLocation } from 'react-router-dom'
import { getRole, mustChangePassword } from '../services/auth'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const role     = getRole()
  const location = useLocation()

  if (!role) {
    return <Navigate to="/login" state={{ next: location.pathname }} replace />
  }

  // Forzar cambio de contraseña antes de cualquier otra cosa
  if (mustChangePassword() && location.pathname !== '/cambiar-clave') {
    return <Navigate to="/cambiar-clave" replace />
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/informe" replace />
  }

  return children
}
