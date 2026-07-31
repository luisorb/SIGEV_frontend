import { Navigate, Outlet } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../useAuth'
import { hasAnyRole } from '../../../lib/permissions'

interface RoleRouteProps {
  roles: readonly string[]
  children?: React.ReactNode
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!hasAnyRole(user.roleNames, roles)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-7 w-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Sin permisos</h2>
        <p className="max-w-md text-sm text-slate-500">
          Su rol no le permite acceder a este módulo. Comuníquese con el administrador si considera que es un error.
        </p>
      </div>
    )
  }
  return children ? <>{children}</> : <Outlet />
}
