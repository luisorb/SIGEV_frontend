import { createContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser } from './types'
import type { UserRole } from '../../types'
import { loginApi } from '../../services/auth.service'
import type { AuthResponse } from '../../services/types'

export interface AuthContextValue {
  user: AuthUser | null
  login: (document: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('sigev-auth')
      return saved ? (JSON.parse(saved) as AuthUser) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (document: string, password: string) => {
    try {
      const response: AuthResponse = await loginApi({ document, password })
      const authUser: AuthUser = {
        id: response.user.id,
        identificador: response.user.document,
        nombre: response.user.fullName,
        email: response.user.email,
        roles: response.user.roles.map(mapBackendRole) as UserRole[],
        activo: true,
      }
      setUser(authUser)
      sessionStorage.setItem('sigev-auth', JSON.stringify(authUser))
      sessionStorage.setItem('sigev-token', response.accessToken)
      return { success: true }
    } catch {
      return { success: false, error: 'Identificador o contraseña incorrectos' }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('sigev-auth')
    sessionStorage.removeItem('sigev-token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

function mapBackendRole(role: string): string {
  const roleMap: Record<string, string> = {
    admin: 'Administrador',
    Administrador: 'Administrador',
    operator: 'Operador',
    Operador: 'Operador',
    supervisor: 'Supervisor',
    Supervisor: 'Supervisor',
    consulta: 'Consulta',
    Consulta: 'Consulta',
    auditor: 'Auditor',
    Auditor: 'Auditor',
  }
  return roleMap[role] || role
}
