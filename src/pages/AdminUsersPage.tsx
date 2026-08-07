import { useState, useMemo, useEffect } from 'react'
import { Plus, ShieldCheck, Shield, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Users, Pencil, Power, PowerOff, Eye, EyeOff, Handshake } from 'lucide-react'
import { useToast } from '../components/ToastProvider'
import { USER_ROLES } from '../config/constants'
import { getUsersApi, createUserApi, updateUserApi } from '../services/users.service'
import { getAlliesApi } from '../services/allies.service'
import type { CreateUserDto, UpdateUserDto } from '../services/types'
import { ROLE_LABELS } from '../lib/permissions'
import { getApiErrorMessage } from '../lib/apiErrors'

interface User {
  id: string
  identificador: string
  nombre: string
  email: string
  password: string
  roles: string[]
  activo: boolean
  allyId?: string | null
  aliadoNombre?: string
}

type SortableColumn = 'identificador' | 'nombre' | 'email'

const roleColors: Record<string, string> = {
  technical_admin: 'bg-purple-100 text-purple-700',
  functional_admin: 'bg-indigo-100 text-indigo-700',
  approver: 'bg-rose-100 text-rose-700',
  operator: 'bg-blue-100 text-blue-700',
  solicitante: 'bg-cyan-100 text-cyan-700',
  analista: 'bg-teal-100 text-teal-700',
  supervisor: 'bg-amber-100 text-amber-700',
  auditor: 'bg-green-100 text-green-700',
  consulta: 'bg-slate-100 text-slate-700',
}

const adminRoles = ['technical_admin', 'functional_admin']

function mapUsers(data: { id: string; document: string; fullName: string; email: string; isActive: boolean; roles: { name: string }[]; allyId?: string | null; ally?: { name: string } | null }[]): User[] {
  return data.map(u => ({
    id: u.id,
    identificador: u.document,
    nombre: u.fullName,
    email: u.email,
    password: '',
    roles: u.roles.map((r) => r.name),
    activo: u.isActive,
    allyId: u.allyId ?? null,
    aliadoNombre: u.ally?.name ?? '',
  }))
}

function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role
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
  const toast = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [allies, setAllies] = useState<{ id: string; code: string; name: string }[]>([])

  useEffect(() => {
    getUsersApi().then(data => setUsers(mapUsers(data)))
    getAlliesApi().then(data => setAllies(data.map(a => ({ id: a.id, code: a.code, name: a.name }))))
  }, [])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<User, 'id'>, string>>>({})
  const EMPTY_USER: Omit<User, 'id'> = {
    identificador: '',
    nombre: '',
    email: '',
    password: '',
    roles: [],
    activo: true,
    allyId: '',
    aliadoNombre: '',
  }
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>(EMPTY_USER)

  const [isCreating, setIsCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)

  async function handleSave() {
    const cleanedUser: Omit<User, 'id'> = {
      ...newUser,
      identificador: normalizeSpaces(newUser.identificador),
      nombre: normalizeSpaces(newUser.nombre),
      email: normalizeSpaces(newUser.email),
    }
    setNewUser(cleanedUser)
    const newErrors: Partial<Record<keyof Omit<User, 'id'>, string>> = {}
    if (!cleanedUser.identificador.trim()) newErrors.identificador = 'El identificador es obligatorio'
    else if (cleanedUser.identificador.trim().length < 5) newErrors.identificador = 'Mínimo 5 caracteres'
    if (!cleanedUser.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!cleanedUser.email.trim()) newErrors.email = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedUser.email)) newErrors.email = 'Formato de correo inválido'
    if (!editingUser && !cleanedUser.password) newErrors.password = 'La contraseña es obligatoria'
    else if (cleanedUser.password && cleanedUser.password.length < 8) newErrors.password = 'Mínimo 8 caracteres'
    if (cleanedUser.roles.length === 0) newErrors.roles = 'Seleccione al menos un rol'
    if (cleanedUser.roles.includes('operator') && !cleanedUser.allyId) newErrors.allyId = 'Seleccione el Aliado para el rol Operador'
    if (cleanedUser.identificador && users.some(u => u.id !== editingUser?.id && u.identificador.toLowerCase() === cleanedUser.identificador.toLowerCase())) newErrors.identificador = 'El identificador ya está en uso'
    if (cleanedUser.email && users.some(u => u.id !== editingUser?.id && u.email.toLowerCase() === cleanedUser.email.toLowerCase())) newErrors.email = 'El correo ya está en uso'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    try {
      if (editingUser) {
        const updateData: UpdateUserDto = {
          document: cleanedUser.identificador,
          fullName: cleanedUser.nombre,
          email: cleanedUser.email,
          roles: cleanedUser.roles,
          allyId: cleanedUser.allyId || null,
        }
        if (cleanedUser.password) updateData.password = cleanedUser.password
        await updateUserApi(editingUser.id, updateData)
        toast.showToast(`Usuario "${cleanedUser.nombre}" actualizado correctamente`)
      } else {
        const createDto: CreateUserDto = {
          document: cleanedUser.identificador,
          documentType: 'CC',
          fullName: cleanedUser.nombre,
          email: cleanedUser.email,
          password: cleanedUser.password,
          roles: cleanedUser.roles,
          allyId: cleanedUser.allyId || undefined,
        }
        await createUserApi(createDto)
        toast.showToast(`Usuario "${cleanedUser.nombre}" creado correctamente`)
      }

      const updated = await getUsersApi()
      setUsers(mapUsers(updated))
      setNewUser(EMPTY_USER)
      setErrors({})
      setEditingUser(null)
      setIsCreating(false)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'Error al guardar el usuario'), 'error')
    }
  }

  function openCreate() {
    setEditingUser(null)
    setIsCreating(true)
    setNewUser(EMPTY_USER)
    setErrors({})
    setShowPassword(false)
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
      allyId: user.allyId ?? '',
      aliadoNombre: user.aliadoNombre ?? '',
    })
    setErrors({})
    setShowPassword(false)
  }

  async function handleToggleActive() {
    if (!confirmToggle) return
    const newState = !confirmToggle.activo
    try {
      await updateUserApi(confirmToggle.id, { isActive: newState })
      const updated = await getUsersApi()
      setUsers(mapUsers(updated))
      toast.showToast(`Usuario "${confirmToggle.nombre}" ${newState ? 'activado' : 'inactivado'} correctamente`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'Error al cambiar el estado del usuario'), 'error')
    }
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
          className="w-full pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[calc(100dvh-18rem)]">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <SortHeader column="identificador" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Identificador</SortHeader>
                <SortHeader column="nombre" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Nombre</SortHeader>
                <SortHeader column="email" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort}>Email</SortHeader>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Roles</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Aliado</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-3 sm:px-4 py-3 text-right w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No hay usuarios registrados. Crea el primer usuario.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-mono text-slate-900">{user.identificador}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-slate-900">{user.nombre}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600">{user.email}                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <span key={r} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${roleColors[r] || 'bg-slate-100 text-slate-700'}`}>
                            {adminRoles.includes(r) ? <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                            {roleLabel(r)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600">
                      {user.aliadoNombre
                        ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-700">
                            <Handshake className="w-3.5 h-3.5 text-slate-400" />
                            {user.aliadoNombre}
                          </span>
                        )
                        : user.roles.includes('operator')
                          ? <span className="text-red-500">Sin aliado</span>
                          : <span className="text-slate-300">—</span>}
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
                    maxLength={50}
                    value={newUser.identificador}
                    onChange={(e) => { setNewUser((p) => ({ ...p, identificador: e.target.value })); if (errors.identificador) setErrors((prev) => ({ ...prev, identificador: '' })) }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${errors.identificador ? 'border-red-400' : 'border-slate-300'}`}
                    placeholder="ej: llopez"
                  />
                  {errors.identificador && <p className="text-xs text-red-500">{errors.identificador}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Contraseña <span className="text-red-400 ml-0.5">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      maxLength={50}
                      value={newUser.password}
                      onChange={(e) => { setNewUser((p) => ({ ...p, password: e.target.value })); if (errors.password) setErrors((prev) => ({ ...prev, password: '' })) }}
                      className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${errors.password ? 'border-red-400' : 'border-slate-300'}`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Nombre <span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="text"
                    maxLength={50}
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
                    maxLength={50}
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
                          {adminRoles.includes(r) ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {roleLabel(r)}
                        </div>
                      </label>
                    )
                  })}
                </div>
                {errors.roles && <p className="text-xs text-red-500">{errors.roles}</p>}
              </div>
              {newUser.roles.includes('operator') && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">Aliado asociado <span className="text-red-400 ml-0.5">*</span></label>
                  <div className="relative">
                    <Handshake className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={newUser.allyId ?? ''}
                      onChange={(e) => {
                        setNewUser((p) => ({ ...p, allyId: e.target.value, aliadoNombre: allies.find(a => a.id === e.target.value)?.name ?? '' }))
                        if (errors.allyId) setErrors((prev) => ({ ...prev, allyId: '' }))
                      }}
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${errors.allyId ? 'border-red-400' : 'border-slate-300'}`}
                    >
                      <option value="">Seleccione un aliado...</option>
                      {allies.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-slate-500">El Operador solo verá y gestionará las órdenes asociadas a este Aliado.</p>
                  {errors.allyId && <p className="text-xs text-red-500">{errors.allyId}</p>}
                </div>
              )}
              {isCreating && (
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
              )}
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
