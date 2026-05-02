import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/utils/auth'

interface Props {
  children: React.ReactNode
}

function ProtectedRoute({ children }: Props) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default ProtectedRoute
