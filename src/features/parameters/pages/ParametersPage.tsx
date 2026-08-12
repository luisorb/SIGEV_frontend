import { useState, useMemo, useEffect } from 'react'
import { useToast } from '../../../components/ToastProvider'
import { Settings, Handshake, Banknote, Calculator, Plus, Save, Search, Pencil, Power, PowerOff, Clock, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from 'lucide-react'
import { useParameters } from '../hooks/useParameters'
import { ParameterForm } from '../components/ParameterForm'
import { ParameterHistoryTable } from '../components/ParameterHistoryTable'
import { useAllies, useCreateAlly, useUpdateAlly } from '../../../hooks/useAllies'
import { useDisbursements, useCreateDisbursement, useUpdateDisbursement } from '../../../hooks/useDisbursements'
import { formatCurrencyCO } from '../../../utils/formatters'
import type { Ally, Disbursement } from '../../../types'

type Tab = 'tasas' | 'aliados' | 'desembolsos'

type AllyForm = Omit<Ally, 'id'>
const EMPTY_ALLY: AllyForm = { codigo: '', nombre: '', color: '#3B82F6', activo: true }
const PRESET_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B']

type DesForm = Omit<Disbursement, 'id'>
const EMPTY_DES: DesForm = { nombre: '', codigo: '', vigencia: '', vigenciaInicio: '', vigenciaFin: '', valorReferencia: 0, activo: true }

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

function AliadosTab({ showToast }: { showToast: (message: string, type?: 'success' | 'error') => void }) {
  const { data: aliados = [], isLoading, error } = useAllies({ all: true })
  const createAlly = useCreateAlly()
  const updateAlly = useUpdateAlly()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<'codigo' | 'nombre' | 'estado'>('nombre')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ally | null>(null)
  const [form, setForm] = useState<AllyForm>(EMPTY_ALLY)
  const [errors, setErrors] = useState<Partial<Record<keyof AllyForm, string>>>({})
  const [confirmToggle, setConfirmToggle] = useState<Ally | null>(null)

  function openCreate() { setEditing(null); setForm(EMPTY_ALLY); setErrors({}); setModalOpen(true) }

  function openEdit(a: Ally) { setEditing(a); setForm({ codigo: a.codigo, nombre: a.nombre, color: a.color, activo: a.activo }); setErrors({}); setModalOpen(true) }

  async function handleSave() {
    const newErrors: Partial<Record<keyof AllyForm, string>> = {}
    if (!form.codigo.trim()) newErrors.codigo = 'El código es obligatorio'
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    try {
      if (editing) {
        await updateAlly.mutateAsync({
          id: editing.id,
          data: {
            code: form.codigo,
            name: form.nombre,
            color: form.color,
            isActive: form.activo,
          },
        })
        showToast(`Aliado "${form.nombre}" actualizado correctamente`)
      } else {
        await createAlly.mutateAsync({
          code: form.codigo,
          name: form.nombre,
          color: form.color,
          isActive: form.activo,
        })
        showToast(`Aliado "${form.nombre}" creado correctamente`)
      }
      setModalOpen(false)
    } catch {
      showToast('Error al guardar el aliado. Intenta nuevamente.', 'error')
    }
  }

  async function handleToggleActivo(a: Ally) {
    try {
      await updateAlly.mutateAsync({ id: a.id, data: { isActive: !a.activo } })
      showToast(`Aliado "${a.nombre}" ${a.activo ? 'inactivado' : 'activado'} correctamente`)
      setConfirmToggle(null)
    } catch {
      showToast('Error al cambiar el estado del aliado.', 'error')
    }
  }

  function inp(field: keyof AllyForm) {
    return errors[field] ? inputBase + ' ' + inputError : inputBase
  }

  function toggleSort(col: 'codigo' | 'nombre' | 'estado') {
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
    return [...aliados].filter((a) =>
      !search
        || a.codigo.toLowerCase().includes(q)
        || a.nombre.toLowerCase().includes(q)
    ).sort((a, b) => {
      const cmp = sortColumn === 'codigo'
        ? a.codigo.localeCompare(b.codigo)
        : sortColumn === 'nombre'
          ? a.nombre.localeCompare(b.nombre)
          : (a.activo === b.activo ? 0 : a.activo ? -1 : 1)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [aliados, search, sortColumn, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  function sortHeader(col: 'codigo' | 'nombre' | 'estado', label: string, className = '') {
    const justify = className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : ''
    return (
      <th
        onClick={() => toggleSort(col)}
        className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none ${className}`}
      >
        <div className={`flex items-center gap-0.5 ${justify}`}>
          {label}
          <SortIcon active={sortColumn === col} direction={sortColumn === col ? sortDir : null} />
        </div>
      </th>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-sm text-red-500">Error al cargar aliados desde el servidor.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 gap-2 sm:gap-0.5 relative">
      <LoadingOverlay show={isLoading} message="Cargando aliados..." />
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por código o nombre..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="w-full pl-10 pr-4 py-2 sm:py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150">
          <Plus className="w-4 h-4" /> Nuevo Aliado
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                {sortHeader('codigo', 'Código')}
                {sortHeader('nombre', 'Nombre')}
                {sortHeader('estado', 'Estado', 'text-center')}
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">No hay aliados registrados</td></tr>
              ) : (
                paged.map((a) => (
                  <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${!a.activo ? 'opacity-50' : ''}`}>
                    <td className="px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm text-slate-500">{a.codigo}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: a.color }} />
                        <span className="font-medium text-slate-900 text-sm sm:text-base">{a.nombre}</span>
                      </div>
                    </td>

                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${a.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmToggle(a)} className={`p-1.5 rounded-lg transition-colors ${a.activo ? 'hover:bg-red-50 text-slate-500 hover:text-red-600' : 'hover:bg-green-50 text-slate-500 hover:text-green-600'}`} title={a.activo ? 'Inactivar' : 'Activar'}>{a.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}</button>
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
              <label htmlFor="aliados-pageSize" className="sr-only">Filas por página</label>
              <select
                id="aliados-pageSize"
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
                  <Handshake className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate">{editing ? 'Editar Aliado' : 'Nuevo Aliado'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Información general */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary/70" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Información general</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelBase}>Código {requiredMark}</label>
                    <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); if (errors.codigo) setErrors((prev) => ({ ...prev, codigo: '' })) }} placeholder="Ej: ALY-001" className={inp('codigo')} />
                    {errors.codigo && <p className="text-xs text-red-500 mt-1">{errors.codigo}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelBase}>Nombre {requiredMark}</label>
                    <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' })) }} placeholder="Ej: Aliado SAS" className={inp('nombre')} />
                    {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200" />

              {/* Identidad visual */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary/70" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Identidad visual</h4>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative shrink-0">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Elegir color personalizado"
                    />
                    <span
                      className="block w-12 h-10 rounded-lg border border-slate-200 shadow-sm cursor-pointer transition-transform hover:scale-105"
                      style={{ backgroundColor: form.color }}
                    />
                  </div>
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    maxLength={7}
                    placeholder="#3B82F6"
                    className={`${inputBase} font-mono uppercase tracking-wide max-w-[7.5rem]`}
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        title={c}
                        className={`w-7 h-7 rounded-full border transition-all ${form.color.toLowerCase() === c ? 'ring-2 ring-primary ring-offset-2 scale-110 border-transparent' : 'border-slate-200 hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200" />

              {/* Estado */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-900">Estado</p>
                  <p className="text-xs text-slate-500">{form.activo ? 'El aliado está activo en el catálogo' : 'El aliado está inactivo en el catálogo'}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.activo}
                  onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.activo ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button onClick={() => setModalOpen(false)} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all">Cancelar</button>
              <button onClick={handleSave} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"><Save className="w-4 h-4" />{editing ? 'Guardar Cambios' : 'Crear Aliado'}</button>
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{confirmToggle.activo ? 'Inactivar Aliado' : 'Activar Aliado'}</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción cambiará el estado del aliado.</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de {confirmToggle.activo ? 'inactivar' : 'activar'} <span className="font-semibold">{confirmToggle.nombre}</span>?
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
                {confirmToggle.activo ? 'Sí, Inactivar' : 'Sí, Activar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DesembolsosTab({ showToast }: { showToast: (message: string, type?: 'success' | 'error') => void }) {
  const { data: desembolsos = [], isLoading, error } = useDisbursements({ all: true })
  const createDesembolso = useCreateDisbursement()
  const updateDesembolso = useUpdateDisbursement()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<'codigo' | 'nombre' | 'vigencia' | 'valorReferencia' | 'estado'>('codigo')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Disbursement | null>(null)
  const [form, setForm] = useState<DesForm>(EMPTY_DES)
  const [errors, setErrors] = useState<Partial<Record<keyof DesForm, string>>>({})
  const [confirmToggle, setConfirmToggle] = useState<Disbursement | null>(null)

  function openCreate() { setEditing(null); setForm(EMPTY_DES); setErrors({}); setModalOpen(true) }

  function openEdit(d: Disbursement) { setEditing(d); setForm({ nombre: d.nombre, codigo: d.codigo, vigencia: d.vigencia, vigenciaInicio: d.vigenciaInicio ?? '', vigenciaFin: d.vigenciaFin ?? '', valorReferencia: d.valorReferencia, activo: d.activo }); setErrors({}); setModalOpen(true) }

  async function handleSave() {
    const newErrors: Partial<Record<keyof DesForm, string>> = {}
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (form.nombre.trim().length > 50) newErrors.nombre = 'El nombre no puede superar los 50 caracteres'
    if (!form.codigo.trim()) newErrors.codigo = 'El código es obligatorio'
    if (form.codigo.trim().length > 50) newErrors.codigo = 'El código no puede superar los 50 caracteres'
    if (
      desembolsos.some(
        (d) => d.codigo.trim().toLowerCase() === form.codigo.trim().toLowerCase() && d.id !== editing?.id,
      )
    ) newErrors.codigo = 'Ya existe un recurso disponible con este código'
    if (!form.vigenciaInicio) newErrors.vigenciaInicio = 'La fecha de inicio es obligatoria'
    if (form.vigenciaInicio && form.vigenciaFin && form.vigenciaFin < form.vigenciaInicio) newErrors.vigenciaFin = 'La fecha fin no puede ser anterior al inicio'
    if (form.valorReferencia <= 0) newErrors.valorReferencia = 'El valor de referencia debe ser mayor a 0'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    try {
      const inicio = form.vigenciaInicio || undefined
      const payload = {
        code: form.codigo,
        name: form.nombre,
        amount: form.valorReferencia,
        year: Number(String(inicio).slice(0, 4)),
        isActive: form.activo,
        disbursementDate: inicio,
        fechaInicio: inicio,
        fechaFin: form.vigenciaFin || undefined,
      }
      if (editing) {
        await updateDesembolso.mutateAsync({
          id: editing.id,
          data: payload,
        })
        showToast(`Recurso disponible "${form.codigo}" actualizado correctamente`)
      } else {
        await createDesembolso.mutateAsync(payload)
        showToast(`Recurso disponible "${form.codigo}" creado correctamente`)
      }
      setModalOpen(false)
    } catch {
      showToast('Error al guardar el recurso disponible. Intenta nuevamente.', 'error')
    }
  }

  async function handleToggleActivo(d: Disbursement) {
    try {
      await updateDesembolso.mutateAsync({ id: d.id, data: { isActive: !d.activo } })
      showToast(`Recurso disponible "${d.nombre}" ${d.activo ? 'inactivado' : 'activado'} correctamente`)
      setConfirmToggle(null)
    } catch {
      showToast('Error al cambiar el estado del recurso disponible.', 'error')
    }
  }

  function inp(field: keyof DesForm) {
    return errors[field] ? inputBase + ' ' + inputError : inputBase
  }

  function toggleSort(col: typeof sortColumn) {
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
    return [...desembolsos].filter((d) =>
      !search
        || d.nombre.toLowerCase().includes(q)
        || d.codigo.toLowerCase().includes(q)
        || (d.vigencia ?? '').toLowerCase().includes(q)
        || String(d.valorReferencia).includes(q)
    ).sort((a, b) => {
      const cmp = sortColumn === 'codigo'
        ? a.codigo.localeCompare(b.codigo)
        : sortColumn === 'nombre'
          ? a.nombre.localeCompare(b.nombre)
          : sortColumn === 'vigencia'
            ? (a.vigencia ?? '').localeCompare(b.vigencia ?? '')
            : sortColumn === 'valorReferencia'
              ? a.valorReferencia - b.valorReferencia
              : (a.activo === b.activo ? 0 : a.activo ? -1 : 1)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [desembolsos, search, sortColumn, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  function sortHeader(col: typeof sortColumn, label: string, className = '') {
    const justify = className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : ''
    return (
      <th
        onClick={() => toggleSort(col)}
        className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none ${className}`}
      >
        <div className={`flex items-center gap-0.5 ${justify}`}>
          {label}
          <SortIcon active={sortColumn === col} direction={sortColumn === col ? sortDir : null} />
        </div>
      </th>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-sm text-red-500">Error al cargar recursos disponibles desde el servidor.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 gap-2 sm:gap-0.5 relative">
      <LoadingOverlay show={isLoading} message="Cargando recursos disponibles..." />
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por código, nombre, vigencia..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="w-full pl-10 pr-4 py-2 sm:py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150">
          <Plus className="w-4 h-4" /> Nuevo Recurso disponible
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                {sortHeader('codigo', 'Código')}
                {sortHeader('nombre', 'Nombre')}
                {sortHeader('vigencia', 'Vigencia')}
                {sortHeader('valorReferencia', 'Valor Ref.', 'text-center')}
                {sortHeader('estado', 'Estado', 'text-center')}
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No hay recursos disponibles registrados</td></tr>
              ) : (
                paged.map((d) => (
                  <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${!d.activo ? 'opacity-50' : ''}`}>
                    <td className="px-3 sm:px-4 py-3 font-medium text-slate-900 text-sm">{d.codigo}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600">{d.nombre}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-slate-600">{d.vigencia || '-'}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-center font-medium text-slate-900 tabular-nums">{formatCurrencyCO(d.valorReferencia)}</td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{d.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmToggle(d)} className={`p-1.5 rounded-lg transition-colors ${d.activo ? 'hover:bg-red-50 text-slate-500 hover:text-red-600' : 'hover:bg-green-50 text-slate-500 hover:text-green-600'}`} title={d.activo ? 'Inactivar' : 'Activar'}>{d.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}</button>
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
            <label htmlFor="des-pageSize" className="sr-only">Filas por página</label>
            <select
              id="des-pageSize"
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
                  <Banknote className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-900 truncate">{editing ? 'Editar Recurso disponible' : 'Nuevo Recurso disponible'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Información general */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary/70" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Información general</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelBase}>Código {requiredMark}</label>
                    <input type="text" value={form.codigo} maxLength={50} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); if (errors.codigo) setErrors((prev) => ({ ...prev, codigo: '' })) }} placeholder="Ej: R-001" className={inp('codigo')} />
                    {errors.codigo && <p className="text-xs text-red-500 mt-1">{errors.codigo}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelBase}>Nombre {requiredMark}</label>
                    <input type="text" value={form.nombre} maxLength={50} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' })) }} placeholder="Ej: Recurso disponible Tipo A" className={inp('nombre')} />
                    {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200" />

              {/* Vigencia */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary/70" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Vigencia</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelBase}>Fecha inicio {requiredMark}</label>
                    <input type="date" value={form.vigenciaInicio} onChange={(e) => { setForm({ ...form, vigenciaInicio: e.target.value }); if (errors.vigenciaInicio) setErrors((prev) => ({ ...prev, vigenciaInicio: '' })) }} className={inp('vigenciaInicio')} />
                    {errors.vigenciaInicio && <p className="text-xs text-red-500 mt-1">{errors.vigenciaInicio}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelBase}>Fecha fin</label>
                    <input type="date" value={form.vigenciaFin} onChange={(e) => { setForm({ ...form, vigenciaFin: e.target.value }); if (errors.vigenciaFin) setErrors((prev) => ({ ...prev, vigenciaFin: '' })) }} className={inp('vigenciaFin')} />
                    {errors.vigenciaFin && <p className="text-xs text-red-500 mt-1">{errors.vigenciaFin}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200" />

              {/* Valor de referencia */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-primary/70" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor de referencia</h4>
                </div>
                <div className="space-y-1.5">
                  <label className={labelBase}>Valor {requiredMark}</label>
                  <input type="number" min={0} step={1000} value={form.valorReferencia} onChange={(e) => { setForm({ ...form, valorReferencia: Number(e.target.value) }); if (errors.valorReferencia) setErrors((prev) => ({ ...prev, valorReferencia: '' })) }} placeholder="Ej: 1000000" className={inp('valorReferencia')} />
                  {errors.valorReferencia && <p className="text-xs text-red-500 mt-1">{errors.valorReferencia}</p>}
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button onClick={() => setModalOpen(false)} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all">Cancelar</button>
              <button onClick={handleSave} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"><Save className="w-4 h-4" />{editing ? 'Guardar Cambios' : 'Crear Recurso disponible'}</button>
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
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{confirmToggle.activo ? 'Inactivar Recurso disponible' : 'Activar Recurso disponible'}</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción cambiará el estado del recurso disponible.</p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de {confirmToggle.activo ? 'inactivar' : 'activar'} <span className="font-semibold">{confirmToggle.nombre}</span>?
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
                {confirmToggle.activo ? 'Sí, Inactivar' : 'Sí, Activar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TABS: { key: Tab; label: string; icon: typeof Calculator }[] = [
  { key: 'tasas', label: 'Tasas de Cálculo', icon: Calculator },
  { key: 'aliados', label: 'Aliados', icon: Handshake },
  { key: 'desembolsos', label: 'Recursos disponibles', icon: Banknote },
]

export function ParametersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tasas')
  const [historialOpen, setHistorialOpen] = useState(false)
  const toast = useToast()

  const {
    editParams,
    updateParam,
    versions,
    currentVersion,
    isDirty,
    nextVersion,
    aprobadoPor,
    setAprobadoPor,
    vigenciaInicio,
    setVigenciaInicio,
    vigenciaFin,
    setVigenciaFin,
    saveNewVersion,
    loadVersion,
    discardChanges,
    saveMessage,
    loading,
    error,
    saving,
  } = useParameters()

  useEffect(() => {
    if (saveMessage) {
      toast.showToast(saveMessage.text, saveMessage.type)
    }
  }, [saveMessage, toast])

  return (
    <div className="flex flex-col min-h-0 h-full gap-2">
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Parámetros del Sistema</h1>
        </div>
        <p className="text-sm text-slate-500">
          Gestión de tasas, aliados, recursos disponibles y catálogos maestros del sistema.
        </p>
      </div>

      <div className="border-b border-slate-200 shrink-0">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key !== 'tasas') setHistorialOpen(false)
                setActiveTab(tab.key)
              }}
              className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'tasas' && (
        <div className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="relative">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-slate-500">Cargando parámetros...</span>
              </div>
            )}
            {!loading && (
              <ParameterForm
                editParams={editParams}
                activeVersion={currentVersion ? { version: currentVersion.version, fechaInicio: currentVersion.fechaInicio, fechaFin: currentVersion.fechaFin } : null}
                isDirty={isDirty}
                nextVersion={nextVersion}
                aprobadoPor={aprobadoPor}
                vigenciaInicio={vigenciaInicio}
                vigenciaFin={vigenciaFin}
                saveMessage={saveMessage}
                saving={saving}
                onUpdateParam={updateParam}
                onAprobadoPorChange={setAprobadoPor}
                onVigenciaInicioChange={setVigenciaInicio}
                onVigenciaFinChange={setVigenciaFin}
                onSave={saveNewVersion}
                onDiscard={discardChanges}
              />
            )}
          </div>
          <div className="flex justify-center pb-4 sm:pb-6">
            <button
              onClick={() => setHistorialOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] shadow-sm transition-all"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Ver </span>Historial de Versiones
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">{versions.length}</span>
            </button>
          </div>
          {historialOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
              <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-6xl w-full max-h-[90dvh] sm:max-h-[85vh] animate-[slideInUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-primary/5 shrink-0">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">Historial de Versiones</h3>
                      <p className="text-xs text-slate-500">{versions.length} versión{versions.length !== 1 ? 'es' : ''} registrada{versions.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setHistorialOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ParameterHistoryTable
                    versions={versions}
                    currentVersionId={currentVersion?.id ?? null}
                    onLoadVersion={(id) => { loadVersion(id); const v = versions.find(v => v.id === id); if (v) toast.showToast(`Versión ${v.version} cargada`); setHistorialOpen(false) }}
                  />
                </div>
                <div className="flex justify-end px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
                  <button
                    onClick={() => setHistorialOpen(false)}
                    className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'aliados' && <div className="min-h-0 flex-1 flex flex-col"><AliadosTab showToast={toast.showToast} /></div>}
      {activeTab === 'desembolsos' && <DesembolsosTab showToast={toast.showToast} />}
    </div>
  )
}
