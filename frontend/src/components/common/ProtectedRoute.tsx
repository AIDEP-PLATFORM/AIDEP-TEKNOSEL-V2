import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated, canAccess } from '@/utils/auth'

interface Props {
  children: React.ReactNode
  requireRole?: boolean
}

function ProtectedRoute({ children, requireRole = true }: Props) {
  const { pathname } = useLocation()

  // 1. Token yoksa veya süresi dolmuşsa → login
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  // 2. Rol bazlı erişim kontrolü
  if (requireRole && !canAccess(pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
