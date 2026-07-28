import { useState, useRef } from 'react'
import { Plus, Trash2, ShieldCheck, Shield } from 'lucide-react'

interface User {
  id: string
  nombre: string
  email: string
  rol: 'Administrador' | 'Operador' | 'Consultor'
  activo: boolean
}

const ROLES: User['rol'][] = ['Administrador', 'Operador', 'Consultor']

const initialUsers: User[] = [
  { id: 'usr-001', nombre: 'Luis López', email: 'luis@sigev.co', rol: 'Administrador', activo: true },
  { id: 'usr-002', nombre: 'María García', email: 'maria@sigev.co', rol: 'Operador', activo: true },
  { id: 'usr-003', nombre: 'Carlos Ruiz', email: 'carlos@sigev.co', rol: 'Consultor', activo: false },
]

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    nombre: '',
    email: '',
    rol: 'Operador',
    activo: true,
  })
  const idCounter = useRef(3)

  function handleAdd() {
    if (!newUser.nombre || !newUser.email) return
    idCounter.current += 1
    const user: User = {
      id: `usr-${String(idCounter.current).padStart(3, '0')}`,
      ...newUser,
    }
    setUsers((prev) => [user, ...prev])
    setNewUser({ nombre: '', email: '', rol: 'Operador', activo: true })
    setShowForm(false)
  }

  function handleRemove(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  function handleToggleActive(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">Gestión de usuarios y roles del sistema</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Nombre</label>
              <input
                type="text"
                value={newUser.nombre}
                onChange={(e) => setNewUser((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                placeholder="usuario@sigev.co"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Rol</label>
              <select
                value={newUser.rol}
                onChange={(e) => setNewUser((p) => ({ ...p, rol: e.target.value as User['rol'] }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!newUser.nombre || !newUser.email}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Crear Usuario
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.nombre}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.rol === 'Administrador' ? 'bg-purple-100 text-purple-700' :
                      user.rol === 'Operador' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.rol === 'Administrador' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.activo
                            ? 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                            : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                        }`}
                        title={user.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(user.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
