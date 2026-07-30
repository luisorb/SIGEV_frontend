import { useState, useRef, useMemo } from 'react'
import { Plus, Trash2, ShieldCheck, Shield, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Users, Pencil, Power, PowerOff } from 'lucide-react'
import { USER_ROLES } from '../config/constants'
import type { UserRole } from '../types'

interface User {
  id: string
  identificador: string
  nombre: string
  email: string
  password: string
  roles: UserRole[]
  activo: boolean
}

const initialUsers: User[] = [
  { id: 'usr-001', identificador: 'llopez', nombre: 'Luis López', email: 'luis@sigev.co', password: '', roles: ['Administrador'], activo: true },
  { id: 'usr-002', identificador: 'mgarcia', nombre: 'María García', email: 'maria@sigev.co', password: '', roles: ['Operador'], activo: true },
  { id: 'usr-003', identificador: 'cruiz', nombre: 'Carlos Ruiz', email: 'carlos@sigev.co', password: '', roles: ['Supervisor', 'Consulta'], activo: false },
]

const SORTABLE_TEXT_COLUMNS = ['identificador', 'nombre', 'email'] as const
type SortableColumn = (typeof SORTABLE_TEXT_COLUMNS)[number]

const roleColors: Record<string, string> = {
  Administrador: 'bg-purple-100 text-purple-700',
  Operador: 'bg-blue-100 text-blue-700',
  Supervisor: 'bg-amber-100 text-amber-700',
  Consulta: 'bg-slate-100 text-slate-700',
  Auditor: 'bg-green-100 text-green-700',
}
type PageSize = 10 | 20 | 30 | 50 | 100

interface SortHeaderProps {
  column: SortableColumn
  sortColumn: string
  sortDirection: 'asc' | 'desc' | null
  onSort: (column: SortableColumn) => void
  children: React.ReactNode
}

function SortHeader({ column, sortColumn, sortDirection, onSort, children }: SortHeaderProps) {
  const isActive = sortColumn === column
  return (
    <th
      className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && sortDirection === 'asc' ? (
          <ArrowUp className="w-3 h-3" />
        ) : isActive && sortDirection === 'desc' ? (
          <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </div>
    </th>
  )
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<User, 'id'>, string>>>({})
  const EMPTY_USER: Omit<User, 'id'> = {
    identificador: '',
    nombre: '',
    email: '',
    password: '',
    roles: [],
    activo: true,
  }
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>(EMPTY_USER)
  const idCounter = useRef(3)

  const [isCreating, setIsCreating] = useState(false)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)

  function handleSave() {
    const newErrors: Partial<Record<keyof Omit<User, 'id'>, string>> = {}
    if (!newUser.identificador.trim()) newErrors.identificador = 'El identificador es obligatorio'
    if (!newUser.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!newUser.email.trim()) newErrors.email = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) newErrors.email = 'Formato de correo inválido'
    if (!editingUser && !newUser.password) newErrors.password = 'La contraseña es obligatoria'
    else if (newUser.password && newUser.password.length < 8) newErrors.password = 'Mínimo 8 caracteres'
    if (newUser.roles.length === 0) newErrors.roles = 'Seleccione al menos un rol'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...newUser, password: newUser.password || u.password }
            : u,
        ),
      )
    } else {
      idCounter.current += 1
      const user: User = {
        id: `usr-${String(idCounter.current).padStart(3, '0')}`,
        ...newUser,
      }
      setUsers((prev) => [user, ...prev])
    }

    setNewUser(EMPTY_USER)
    setErrors({})
    setEditingUser(null)
    setIsCreating(false)
  }

  function openCreate() {
    setEditingUser(null)
    setIsCreating(true)
    setNewUser(EMPTY_USER)
    setErrors({})
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setIsCreating(false)
    setNewUser({
      identificador: user.identificador,
      nombre: user.nombre,
      email: user.email,
      password: '',
      roles: [...user.roles],
      activo: user.activo,
    })
    setErrors({})
  }

  function handleDeleteRequest(id: string) {
    const user = users.find((u) => u.id === id)
    if (user) setDeleteUser(user)
  }

  function handleDeleteConfirm() {
    if (!deleteUser) return
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
    setDeleteUser(null)
  }

  function handleToggleActive() {
    if (!confirmToggle) return
    setUsers((prev) => prev.map((u) => (u.id === confirmToggle.id ? { ...u, activo: !u.activo } : u)))
    setConfirmToggle(null)
  }

  function toggleSort(column: SortableColumn) {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection('asc')
    } else if (sortDirection === 'asc') {
      setSortDirection('desc')
    } else {
      setSortColumn('')
      setSortDirection(null)
    }
  }

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.identificador.toLowerCase().includes(q) ||
          u.nombre.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }

    if (sortDirection && sortColumn) {
      result.sort((a, b) => {
        const aVal = String(a[sortColumn as keyof User] ?? '')
        const bVal = String(b[sortColumn as keyof User] ?? '')
        const cmp = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' })
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [users, search, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500">Gestión de usuarios y roles del sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="relative w-full sm:w-96 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 sm:py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <SortHeader column="identificador" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Identificador</SortHeader>
                <SortHeader column="nombre" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Nombre</SortHeader>
                <SortHeader column="email" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Email</SortHeader>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Roles</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-3 sm:px-4 py-3 text-right w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No hay usuarios registrados. Crea el primer usuario.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-mono text-slate-900">{user.identificador}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-slate-900">{user.nombre}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600">{user.email}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${roleColors[r] || 'bg-slate-100 text-slate-700'}`}>
                            {r === 'Administrador' ? <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                        user.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmToggle(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.activo
                              ? 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                              : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                          }`}
                          title={user.activo ? 'Inactivar' : 'Activar'}
                        >
                          {user.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(user.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
            <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredUsers.length)} de {filteredUsers.length}</span>
            <span className="text-slate-300">|</span>
            <label htmlFor="pageSize" className="sr-only">Filas por página</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value) as PageSize); setPage(1) }}
              className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              {[10, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size}>{size} filas</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
              title="Primera página"
            >
              <ChevronsLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 min-w-[100px] sm:min-w-[120px] text-center">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
              title="Última página"
            >
              <ChevronsRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[slideInUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Eliminar usuario</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de eliminar a <span className="font-semibold">{deleteUser.nombre}</span>?
            </p>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                onClick={() => setDeleteUser(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmToggle && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[slideInUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg shrink-0 ${confirmToggle.activo ? 'bg-red-100' : 'bg-green-100'}`}>
                {confirmToggle.activo ? <PowerOff className="w-5 h-5 text-red-600" /> : <Power className="w-5 h-5 text-green-600" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{confirmToggle.activo ? 'Inactivar Usuario' : 'Activar Usuario'}</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción cambiará el estado del usuario.</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de {confirmToggle.activo ? 'inactivar' : 'activar'} a <span className="font-semibold">{confirmToggle.nombre}</span>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                onClick={() => setConfirmToggle(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleActive}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                {confirmToggle.activo ? 'Sí, Inactivar' : 'Sí, Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {(isCreating || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-xl w-full max-h-[90dvh] animate-[slideInUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              </div>
              <button onClick={() => { setEditingUser(null); setIsCreating(false) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Identificador <span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="text"
                    value={newUser.identificador}
                    onChange={(e) => { setNewUser((p) => ({ ...p, identificador: e.target.value })); if (errors.identificador) setErrors((prev) => ({ ...prev, identificador: '' })) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${errors.identificador ? 'border-red-400' : 'border-slate-300'}`}
                    placeholder="ej: llopez"
                  />
                  {errors.identificador && <p className="text-xs text-red-500">{errors.identificador}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Contraseña <span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => { setNewUser((p) => ({ ...p, password: e.target.value })); if (errors.password) setErrors((prev) => ({ ...prev, password: '' })) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${errors.password ? 'border-red-400' : 'border-slate-300'}`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Nombre <span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="text"
                    value={newUser.nombre}
                    onChange={(e) => { setNewUser((p) => ({ ...p, nombre: e.target.value })); if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' })) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${errors.nombre ? 'border-red-400' : 'border-slate-300'}`}
                    placeholder="Nombre completo"
                  />
                  {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Correo <span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => { setNewUser((p) => ({ ...p, email: e.target.value })); if (errors.email) setErrors((prev) => ({ ...prev, email: '' })) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${errors.email ? 'border-red-400' : 'border-slate-300'}`}
                    placeholder="usuario@sigev.co"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Roles <span className="text-red-400 ml-0.5">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {USER_ROLES.map((r) => {
                    const selected = newUser.roles.includes(r)
                    return (
                      <label
                        key={r}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          selected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            setNewUser((p) => ({
                              ...p,
                              roles: selected ? p.roles.filter((x) => x !== r) : [...p.roles, r],
                            }))
                            if (errors.roles) setErrors((prev) => ({ ...prev, roles: '' }))
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <div className="flex items-center gap-1.5">
                          {r === 'Administrador' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {r}
                        </div>
                      </label>
                    )
                  })}
                </div>
                {errors.roles && <p className="text-xs text-red-500">{errors.roles}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Estado</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="estado"
                      checked={newUser.activo}
                      onChange={() => setNewUser((p) => ({ ...p, activo: true }))}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-slate-700">Activo</span>
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="estado"
                      checked={!newUser.activo}
                      onChange={() => setNewUser((p) => ({ ...p, activo: false }))}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-slate-700">Inactivo</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-4 sm:px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl shrink-0">
              <button onClick={() => { setEditingUser(null); setIsCreating(false) }} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                {editingUser ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
