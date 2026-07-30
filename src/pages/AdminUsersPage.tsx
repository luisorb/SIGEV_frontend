import { useState, useRef, useMemo } from 'react'
import { Plus, Trash2, ShieldCheck, Shield, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

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

const SORTABLE_TEXT_COLUMNS = ['nombre', 'email', 'rol'] as const
type SortableColumn = (typeof SORTABLE_TEXT_COLUMNS)[number]
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
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none"
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
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    nombre: '',
    email: '',
    rol: 'Operador',
    activo: true,
  })
  const idCounter = useRef(3)

  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)

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

  function handleDeleteRequest(id: string) {
    const user = users.find((u) => u.id === id)
    if (user) setDeleteUser(user)
  }

  function handleDeleteConfirm() {
    if (!deleteUser) return
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
    setDeleteUser(null)
  }

  function handleToggleActive(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)))
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
    <>
      <div className="space-y-4">
      <div className="flex items-center justify-between shrink-0">
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
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 shrink-0">
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

      <div className="relative w-full sm:w-96 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <SortHeader column="nombre" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Nombre</SortHeader>
                <SortHeader column="email" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Email</SortHeader>
                <SortHeader column="rol" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Rol</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No hay usuarios registrados. Crea el primer usuario.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
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
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Mostrando página {page} de {totalPages} ({filteredUsers.length} resultados)</span>
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
            <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] text-center">
              Página <span className="text-primary font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
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
      </div>

      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Eliminar usuario</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de eliminar a <span className="font-semibold">{deleteUser.nombre}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteUser(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
