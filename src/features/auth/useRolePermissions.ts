import { useAuth } from './useAuth'
import { can, hasAnyRole } from '../../lib/permissions'

export function useRolePermissions() {
  const { user } = useAuth()
  const roleNames = user?.roleNames ?? []

  return {
    roleNames,
    can: (...required: string[]) => can(roleNames, ...required),
    hasAnyRole: (allowed: readonly string[]) => hasAnyRole(roleNames, allowed),
  }
}
