import type { UserRole } from '../../../types'

export interface AuthUser {
  id: string
  identificador: string
  nombre: string
  email: string
  roles: UserRole[]
  activo: boolean
}

export interface LoginInput {
  identificador: string
  password: string
}
