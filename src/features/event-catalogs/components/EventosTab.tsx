import { useState, useMemo } from 'react'
import {
  Plus, Search, Pencil, Power, PowerOff, X, Save, CalendarRange,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2,
} from 'lucide-react'
import { useEventCatalogs, useCreateEventCatalog, useUpdateEventCatalog } from '../../../hooks/useEventCatalogs'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import type { EventCatalog } from '../../../types'

type SortColumn = 'nombre' | 'creadoPor'

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' | null }) {
  if (active && direction === 'asc') return <ArrowUp className="w-3 h-3 ml-1 shrink-0" />
  if (active && direction === 'desc') return <ArrowDown className="w-3 h-3 ml-1 shrink-0" />
  return <ArrowUpDown className="w-3 h-3 ml-1 shrink-0 opacity-40" />
}

const inputBase = [
  'w-full px-3 py-2.5',
  'border border-slate-300 rounded-lg',
  'text-sm text-slate-900',
  'bg-white',
  'placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
  'transition-shadow duration-150',
].join(' ')

const inputError = 'border-red-300 focus:ring-red-300/40 focus:border-red-400'
const labelBase = 'block text-sm font-medium text-slate-700'
const requiredMark = <span className="text-red-400 ml-0.5">*</span>

interface LoadingOverlayProps {
  show: boolean
  message: string
}

function LoadingOverlay({ show, message }: LoadingOverlayProps) {
  if (!show) return null
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 rounded-xl">
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-slate-600">{message}</span>
      </div>
    </div>
  )
}

function sanitizeName(value: string): string {
  return value
    .replace(/^[\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+$/, '')
    .slice(0, 100)
}

export function EventosTab({ showToast }: { showToast: (message: string, type?: 'success' | 'error') => void }) {
  const { data: eventos = [], isLoading, error } = useEventCatalogs({ all: true })
  const createEvento = useCreateEventCatalog()
  const updateEvento = useUpdateEventCatalog()

  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('nombre')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EventCatalog | null>(null)
  const [name, setName] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmToggle, setConfirmToggle] = useState<EventCatalog | null>(null)

  function openCreate() {
    setEditing(null)
    setName('')
    setFieldError('')
    setModalOpen(true)
  }

  function openEdit(e: EventCatalog) {
    setEditing(e)
    setName(e.nombre)
    setFieldError('')
    setModalOpen(true)
  }

  function validateName(value: string): string | null {
    const v = sanitizeName(value)
    if (!v) return 'El nombre del evento es obligatorio'
    if (v.length < 3) return 'El nombre del evento debe tener al menos 3 caracteres'
    if (v.length > 100) return 'El nombre del evento no puede superar los 100 caracteres'
    const duplicate = eventos.some(
      (item) => item.nombre.trim().toLowerCase() === v.toLowerCase() && item.id !== editing?.id,
    )
    if (duplicate) return 'Ya existe un evento con este nombre'
    return null
  }

  async function handleSave() {
    const errorMsg = validateName(name)
    if (errorMsg) {
      setFieldError(errorMsg)
      return
    }
    setSaving(true)
    try {
      const payload = { name: sanitizeName(name) }
      if (editing) {
        await updateEvento.mutateAsync({ id: editing.id, data: payload })
        showToast(`Evento "${payload.name}" actualizado correctamente`)
      } else {
        await createEvento.mutateAsync(payload)
        showToast(`Evento "${payload.name}" creado correctamente`)
      }
      setModalOpen(false)
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Error al guardar el evento. Intenta nuevamente.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActivo(e: EventCatalog) {
    try {
      await updateEvento.mutateAsync({ id: e.id, data: { isActive: !e.activo } })
      showToast(`Evento "${e.nombre}" ${e.activo ? 'inactivado' : 'activado'} correctamente`)
      setConfirmToggle(null)
    } catch {
      showToast('Error al cambiar el estado del evento.', 'error')
    }
  }

  function toggleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDir('asc')
    }
    setPage(0)
  }

  const sorted = useMemo(() => {
    const q = search.toLowerCase()
    return [...eventos]
      .filter((e) => !search || e.nombre.toLowerCase().includes(q) || e.creadoPor.toLowerCase().includes(q))
      .sort((a, b) => {
        const cmp = sortColumn === 'nombre'
          ? a.nombre.localeCompare(b.nombre)
          : a.creadoPor.localeCompare(b.creadoPor)
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [eventos, search, sortColumn, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  function sortHeader(col: SortColumn, label: string) {
    return (
      <th
        onClick={() => toggleSort(col)}
        className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
      >
        <div className="flex items-center gap-0.5">
          {label}
          <SortIcon active={sortColumn === col} direction={sortColumn === col ? sortDir : null} />
        </div>
      </th>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-sm text-red-500">Error al cargar eventos desde el servidor.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 gap-2 sm:gap-0.5 relative">
      <LoadingOverlay show={isLoading} message="Cargando eventos..." />
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="w-full pl-10 pr-4 py-2 sm:py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150">
          <Plus className="w-4 h-4" /> Nuevo Evento
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                {sortHeader('nombre', 'Nombre del evento')}
                {sortHeader('creadoPor', 'Creado por')}
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-slate-500">No hay eventos registrados</td></tr>
              ) : (
                paged.map((e) => (
                  <tr key={e.id} className={`hover:bg-slate-50 transition-colors ${!e.activo ? 'opacity-50' : ''}`}>
                    <td className="px-3 sm:px-4 py-3 font-medium text-slate-900 text-sm">{e.nombre}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600">{e.creadoPor}</td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmToggle(e)} className={`p-1.5 rounded-lg transition-colors ${e.activo ? 'hover:bg-red-50 text-slate-500 hover:text-red-600' : 'hover:bg-green-50 text-slate-500 hover:text-green-600'}`} title={e.activo ? 'Deshabilitar' : 'Habilitar'}>{e.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {sorted.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Mostrando página {safePage + 1} de {totalPages} ({sorted.length} resultados)</span>
              <span className="text-slate-300">|</span>
              <label htmlFor="eventos-pageSize" className="sr-only">Filas por página</label>
              <select
                id="eventos-pageSize"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
                className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                {[5, 8, 10, 15, 20, 30, 50].map((size) => (
                  <option key={size} value={size}>{size} filas</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={safePage === 0}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 0}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] text-center">
                Página <span className="text-primary font-semibold">{safePage + 1}</span> de <span className="font-semibold">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={safePage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-lg w-full max-h-[90dvh] animate-[slideInUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  <CalendarRange className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate">{editing ? 'Editar Evento' : 'Nuevo Evento'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} disabled={saving} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 disabled:opacity-40">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto">
              <div className="space-y-1.5">
                <label className={labelBase}>Nombre del evento {requiredMark}</label>
                <input
                  type="text"
                  value={name}
                  maxLength={100}
                  autoFocus
                  onChange={(e) => { setName(sanitizeName(e.target.value)); if (fieldError) setFieldError('') }}
                  placeholder="Ej: MESA DE TRABAJO"
                  className={fieldError ? inputBase + ' ' + inputError : inputBase}
                  disabled={saving}
                />
                {fieldError && <p className="text-xs text-red-500 mt-1">{fieldError}</p>}
                <p className="text-xs text-slate-400">Mínimo 3 caracteres y máximo 100. Sin espacios al inicio ni al final y máximo un espacio entre palabras.</p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-40">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Guardando...' : (editing ? 'Guardar Cambios' : 'Crear Evento')}
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{confirmToggle.activo ? 'Deshabilitar Evento' : 'Habilitar Evento'}</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción cambiará el estado del evento.</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de {confirmToggle.activo ? 'deshabilitar' : 'habilitar'} <span className="font-semibold">{confirmToggle.nombre}</span>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                onClick={() => setConfirmToggle(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleToggleActivo(confirmToggle)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                {confirmToggle.activo ? 'Sí, Deshabilitar' : 'Sí, Habilitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}