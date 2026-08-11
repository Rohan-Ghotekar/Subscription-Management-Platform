import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()

  // Not logged in at all → send to login page
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = user.role || ''.toLowerCase()
  // Logged in but wrong role → send to their correct dashboard
  if (allowedRole && userRole !== allowedRole.toLowerCase()) {
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (userRole === 'provider') return <Navigate to="/provider/dashboard" replace />
    return <Navigate to="/dashboard" replace />
  }

  // All good → show the page
  return children
}

export default ProtectedRoute