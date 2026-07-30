import type { UserRole } from '../types'

export interface StoredUser {
  id: string
  identificador: string
  nombre: string
  email: string
  password: string
  roles: UserRole[]
  activo: boolean
}

const USERS_KEY = 'sigev-usuarios'

let nextUserId = 4

function getMockUsers(): StoredUser[] {
  return [
    { id: 'usr-001', identificador: 'llopez', nombre: 'Luis López', email: 'luis@sigev.co', password: '12345678', roles: ['Administrador'], activo: true },
    { id: 'usr-002', identificador: 'mgarcia', nombre: 'María García', email: 'maria@sigev.co', password: '12345678', roles: ['Operador'], activo: true },
    { id: 'usr-003', identificador: 'cruiz', nombre: 'Carlos Ruiz', email: 'carlos@sigev.co', password: '12345678', roles: ['Supervisor', 'Consulta'], activo: false },
  ]
}

function load(): StoredUser[] {
  try {
    const saved = localStorage.getItem(USERS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as StoredUser[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* fall through */ }
  const mock = getMockUsers()
  localStorage.setItem(USERS_KEY, JSON.stringify(mock))
  return mock
}

function persist(list: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list))
}

export function getUsersSync(): StoredUser[] {
  return load()
}

export function addUserSync(data: Omit<StoredUser, 'id'>): StoredUser {
  const list = load()
  const user: StoredUser = { id: `usr-${String(nextUserId++).padStart(3, '0')}`, ...data }
  persist([...list, user])
  return user
}

export function updateUserSync(id: string, data: Partial<StoredUser>) {
  const list = load()
  persist(list.map((u) => (u.id === id ? { ...u, ...data } : u)))
}

export function toggleUserActiveSync(id: string) {
  const list = load()
  const user = list.find((u) => u.id === id)
  if (!user) return
  persist(list.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)))
}

export function deleteUserSync(id: string) {
  persist(load().filter((u) => u.id !== id))
}

export function authenticateUser(identificador: string, password: string): StoredUser | null {
  const users = load()
  const user = users.find(
    (u) => u.identificador.toLowerCase() === identificador.toLowerCase() && u.password === password && u.activo,
  )
  return user ?? null
}
