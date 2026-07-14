import { Navigate, useLocation } from 'react-router-dom'
import { getRole, mustChangePassword } from '../services/auth'

export default function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const role     = getRole()
  const location = useLocation()

  if (!role) {
    return <Navigate to="/login" state={{ next: location.pathname }} replace />
  }

  if (mustChangePassword() && location.pathname !== '/cambiar-clave') {
    return <Navigate to="/cambiar-clave" replace />
  }

  // Solo superadmin puede acceder a rutas superAdminOnly
  if (superAdminOnly && role !== 'superadmin') {
    return <Navigate to="/" replace />
  }

  // admin y superadmin pueden acceder a rutas adminOnly
  if (adminOnly && role !== 'admin' && role !== 'superadmin') {
    return <Navigate to="/informe" replace />
  }

  return children
}
