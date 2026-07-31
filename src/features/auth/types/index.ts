import type { Role } from '../../../types'

export interface AuthUser {
  id: string
  identificador: string
  nombre: string
  email: string
  roles: Role[]
  roleNames: string[]
  activo: boolean
}

export interface LoginInput {
  identificador: string
  password: string
}
