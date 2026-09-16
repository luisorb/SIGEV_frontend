import { Navigate } from 'react-router-dom'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { useAuth } from '../features/auth/useAuth'
import { hasAnyRole } from '../lib/permissions'

const ROLES_WITH_PANEL = ['technical_admin', 'functional_admin', 'approver', 'analista', 'supervisor', 'auditor', 'consulta'] as const

export function DashboardGuard() {
  const { user } = useAuth()
  if (!user || !hasAnyRole(user.roleNames, ROLES_WITH_PANEL)) {
    return <Navigate to="/ordenes" replace />
  }
  return <DashboardPage />
}