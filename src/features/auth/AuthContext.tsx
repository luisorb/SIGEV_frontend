import { createContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser } from './types'
import type { Role } from '../../types'
import { loginApi } from '../../services/auth.service'
import type { AuthResponse } from '../../services/types'

export interface AuthContextValue {
  user: AuthUser | null
  login: (document: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
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
      const roles: Role[] = response.user.roles
      const authUser: AuthUser = {
        id: response.user.id,
        identificador: response.user.document,
        nombre: response.user.fullName,
        email: response.user.email,
        roles,
        roleNames: roles.map((role) => role.name),
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
