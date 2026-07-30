import { createContext, useState, useCallback, type ReactNode } from 'react'
import { authenticateUser } from '../../lib/usersStore'
import type { AuthUser } from './types'

export interface AuthContextValue {
  user: AuthUser | null
  login: (identificador: string, password: string) => { success: boolean; error?: string }
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => ({ success: false }),
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

  const login = useCallback((identificador: string, password: string) => {
    const found = authenticateUser(identificador, password)
    if (!found) {
      return { success: false, error: 'Identificador o contraseña incorrectos' }
    }
    const authUser: AuthUser = {
      id: found.id,
      identificador: found.identificador,
      nombre: found.nombre,
      email: found.email,
      roles: found.roles,
      activo: found.activo,
    }
    setUser(authUser)
    sessionStorage.setItem('sigev-auth', JSON.stringify(authUser))
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('sigev-auth')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}



