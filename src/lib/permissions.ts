import type { RoleName } from '../types'

export const ROLE_LABELS: Record<RoleName, string> = {
  technical_admin: 'Administrador Técnico',
  functional_admin: 'Administrador Funcional',
  approver: 'Aprobador',
  operator: 'Operador',
  solicitante: 'Solicitante',
  analista: 'Analista',
  supervisor: 'Supervisor',
  auditor: 'Auditor',
  consulta: 'Consulta',
}

export const ALL_ROLES: RoleName[] = [
  'technical_admin',
  'functional_admin',
  'approver',
  'operator',
  'solicitante',
  'analista',
  'supervisor',
  'auditor',
  'consulta',
]

export const ROLES_CAN_MANAGE_USERS = ['technical_admin'] as const
export const ROLES_CAN_READ_AUDIT = ['technical_admin', 'functional_admin', 'supervisor', 'approver', 'auditor'] as const
export const ROLES_CAN_SEE_REPORTS = ['functional_admin', 'supervisor', 'operator', 'analista', 'consulta', 'auditor', 'approver'] as const

export const ROLES_CAN_CREATE_EVENT = ['functional_admin', 'operator', 'solicitante'] as const
export const ROLES_CAN_EDIT_EVENT = ['functional_admin', 'supervisor', 'analista', 'solicitante'] as const
export const ROLES_CAN_DELETE_EVENT = ['functional_admin'] as const
export const ROLES_CAN_CHANGE_STATUS = ['approver'] as const
export const ROLES_CAN_MANAGE_ITEMS = ['functional_admin', 'solicitante'] as const
export const ROLES_CAN_MANAGE_OFFERS = ['functional_admin', 'operator'] as const
export const ROLES_CAN_MANAGE_ALLIES = ['functional_admin'] as const
export const ROLES_CAN_MANAGE_DISBURSEMENTS = ['functional_admin'] as const
export const ROLES_CAN_MANAGE_PARAMETERS = ['functional_admin'] as const
export const ROLES_CAN_MANAGE_TECH = ['technical_admin'] as const
export const ROLES_CAN_MANAGE_BACKUP = ['technical_admin'] as const

export function can(roles: string[], ...required: string[]): boolean {
  return required.some((role) => roles.includes(role))
}

export function hasAnyRole(roles: string[], allowed: readonly string[]): boolean {
  return allowed.some((role) => roles.includes(role))
}

export function hasRole(roles: string[], role: string): boolean {
  return roles.includes(role)
}
