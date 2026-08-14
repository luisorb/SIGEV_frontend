import { useMemo, useState } from 'react'
import { X, Save, Handshake } from 'lucide-react'
import { useAllies, useCreateAlly, useUpdateAlly } from '../hooks/useAllies'
import { useMunicipalities } from '../hooks/useMunicipalities'
import { useToast } from './ToastProvider'
import { getApiErrorMessage } from '../lib/apiErrors'
import { allyFormSchema } from '../schemas/allySchema'
import type { Ally } from '../types'
import type { AllyResponse } from '../services/allies.service'

type AllyForm = Omit<Ally, 'id' | 'codigo'>
const EMPTY_ALLY: AllyForm = {
  nombre: '', tipoIdentificacion: '', numeroIdentificacion: '',
  telefono: '', correo: '', divipolaCode: '', divipolaDepartment: '',
  contacto: '', color: '#3B82F6', activo: true,
}
const PRESET_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#64748B']
const TIPOS_IDENTIFICACION = ['NIT', 'CC', 'CE', 'TI', 'PAS']

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

function mapAllyResponse(data: AllyResponse): Ally {
  return {
    id: data.id,
    codigo: data.code,
    nombre: data.name,
    tipoIdentificacion: data.documentType ?? '',
    numeroIdentificacion: data.document ?? '',
    telefono: data.phone ?? '',
    correo: data.contactEmail ?? '',
    divipolaCode: data.divipolaCode ?? '',
    divipolaDepartment: data.divipolaDepartment ?? '',
    contacto: data.contactName ?? '',
    color: data.color ?? '#6366F1',
    activo: data.isActive ?? data.active ?? true,
  }
}

interface AllyFormModalProps {
  open: boolean
  editing?: Ally | null
  onClose: () => void
  onSaved?: (ally: Ally) => void
  showEstado?: boolean
}

export function AllyFormModal({ open, editing, onClose, onSaved, showEstado = true }: AllyFormModalProps) {
  const { data: aliados = [] } = useAllies({ all: true })
  const { data: municipios = [] } = useMunicipalities()
  const createAlly = useCreateAlly()
  const updateAlly = useUpdateAlly()
  const toast = useToast()
  const [form, setForm] = useState<AllyForm>(EMPTY_ALLY)
  const [errors, setErrors] = useState<Partial<Record<keyof AllyForm, string>>>({})
  const [lastOpen, setLastOpen] = useState(false)
  const [lastEditingId, setLastEditingId] = useState<string | undefined>(undefined)

  if (open !== lastOpen || editing?.id !== lastEditingId) {
    setLastOpen(open)
    setLastEditingId(editing?.id)
    setErrors({})
    setForm(editing
      ? {
          nombre: editing.nombre,
          tipoIdentificacion: editing.tipoIdentificacion,
          numeroIdentificacion: editing.numeroIdentificacion,
          telefono: editing.telefono,
          correo: editing.correo,
          divipolaCode: editing.divipolaCode,
          divipolaDepartment: editing.divipolaDepartment,
          contacto: editing.contacto,
          color: editing.color,
          activo: showEstado ? editing.activo : true,
        }
      : EMPTY_ALLY)
  }

  const departments = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of municipios) {
      if (!/^\d{5}$/.test(m.id)) continue
      const code = m.id.slice(0, 2)
      if (!map.has(code)) map.set(code, m.departamento)
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [municipios])

  function handleDeptChange(code: string) {
    const dept = departments.find((d) => d.code === code)
    setForm((f) => ({
      ...f,
      divipolaCode: code,
      divipolaDepartment: dept?.name ?? '',
    }))
    if (errors.divipolaCode) setErrors((prev) => ({ ...prev, divipolaCode: '' }))
  }

  async function handleSave() {
    const parsed = allyFormSchema.safeParse(form)
    if (!parsed.success) {
      const newErrors: Partial<Record<keyof AllyForm, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof AllyForm
        if (field && !newErrors[field]) newErrors[field] = issue.message
      }
      setErrors(newErrors)
      return
    }

    const trimmedNombre = form.nombre.trim().toLowerCase()
    const trimmedDoc = form.numeroIdentificacion.trim().toLowerCase()
    const trimmedCorreo = form.correo.trim().toLowerCase()
    const newErrors: Partial<Record<keyof AllyForm, string>> = {}
    if (trimmedNombre && aliados.some((a) => a.id !== editing?.id && a.nombre.trim().toLowerCase() === trimmedNombre)) {
      newErrors.nombre = 'Ya existe un aliado con este nombre (razón social)'
    }
    if (trimmedDoc && aliados.some((a) => a.id !== editing?.id && a.numeroIdentificacion.trim().toLowerCase() === trimmedDoc)) {
      newErrors.numeroIdentificacion = 'Ya existe un aliado con este número de identificación'
    }
    if (trimmedCorreo && aliados.some((a) => a.id !== editing?.id && a.correo.trim().toLowerCase() === trimmedCorreo)) {
      newErrors.correo = 'Ya existe un aliado con este correo electrónico'
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    const payload = {
      name: form.nombre,
      documentType: form.tipoIdentificacion,
      document: form.numeroIdentificacion,
      phone: form.telefono,
      contactEmail: form.correo,
      divipolaCode: form.divipolaCode,
      divipolaDepartment: form.divipolaDepartment,
      contactName: form.contacto,
      color: form.color,
      isActive: form.activo,
    }
    try {
      let saved: Ally
      if (editing) {
        await updateAlly.mutateAsync({ id: editing.id, data: payload })
        saved = { ...editing, nombre: form.nombre, color: form.color, activo: form.activo }
        toast.showToast(`Aliado "${form.nombre}" actualizado correctamente`)
      } else {
        const response = await createAlly.mutateAsync(payload)
        saved = mapAllyResponse(response)
        toast.showToast(`Aliado "${form.nombre}" creado correctamente`)
      }
      onClose()
      onSaved?.(saved)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'Error al guardar el aliado. Intenta nuevamente.'), 'error')
    }
  }

  function inp(field: keyof AllyForm) {
    return errors[field] ? inputBase + ' ' + inputError : inputBase
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-3xl w-full max-h-[90dvh] animate-[slideInUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
              <Handshake className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">{editing ? 'Editar Aliado' : 'Nuevo Aliado'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-primary/70" />
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Datos del aliado</h4>
              <span className="text-[11px] text-slate-400">(todos obligatorios)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelBase}>Nombre (razón social) {requiredMark}</label>
                <input type="text" maxLength={50} value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' })) }} placeholder="Ej: Aliado SAS" className={inp('nombre')} />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelBase}>Tipo de identificación {requiredMark}</label>
                <select value={form.tipoIdentificacion} onChange={(e) => { setForm({ ...form, tipoIdentificacion: e.target.value }); if (errors.tipoIdentificacion) setErrors((prev) => ({ ...prev, tipoIdentificacion: '' })) }} className={inp('tipoIdentificacion')}>
                  <option value="">Seleccione...</option>
                  {TIPOS_IDENTIFICACION.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.tipoIdentificacion && <p className="text-xs text-red-500 mt-1">{errors.tipoIdentificacion}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelBase}>Número de identificación {requiredMark}</label>
                <input type="text" maxLength={20} value={form.numeroIdentificacion} onChange={(e) => { setForm({ ...form, numeroIdentificacion: e.target.value }); if (errors.numeroIdentificacion) setErrors((prev) => ({ ...prev, numeroIdentificacion: '' })) }} placeholder="Ej: 900123456" className={inp('numeroIdentificacion')} />
                {errors.numeroIdentificacion && <p className="text-xs text-red-500 mt-1">{errors.numeroIdentificacion}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelBase}>Teléfono {requiredMark}</label>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={15} value={form.telefono} onChange={(e) => { setForm({ ...form, telefono: e.target.value.replace(/\D/g, '') }); if (errors.telefono) setErrors((prev) => ({ ...prev, telefono: '' })) }} placeholder="Ej: 6010000000" className={inp('telefono')} />
                {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelBase}>Correo electrónico {requiredMark}</label>
                <input type="email" maxLength={50} value={form.correo} onChange={(e) => { setForm({ ...form, correo: e.target.value }); if (errors.correo) setErrors((prev) => ({ ...prev, correo: '' })) }} placeholder="Ej: contacto@aliado.com" className={inp('correo')} />
                {errors.correo && <p className="text-xs text-red-500 mt-1">{errors.correo}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelBase}>Divipola departamento {requiredMark}</label>
                <select value={form.divipolaCode} onChange={(e) => handleDeptChange(e.target.value)} className={inp('divipolaCode')}>
                  <option value="">Seleccione...</option>
                  {departments.map((d) => <option key={d.code} value={d.code}>{d.name} ({d.code})</option>)}
                </select>
                {errors.divipolaCode && <p className="text-xs text-red-500 mt-1">{errors.divipolaCode}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelBase}>Contacto (nombres y apellidos) {requiredMark}</label>
                <input type="text" maxLength={50} value={form.contacto} onChange={(e) => { setForm({ ...form, contacto: e.target.value }); if (errors.contacto) setErrors((prev) => ({ ...prev, contacto: '' })) }} placeholder="Ej: Carlos López" className={inp('contacto')} />
                {errors.contacto && <p className="text-xs text-red-500 mt-1">{errors.contacto}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200" />

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

          {showEstado && (
            <>
              <div className="border-t border-slate-200" />
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
            </>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button onClick={onClose} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all">Cancelar</button>
          <button onClick={handleSave} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"><Save className="w-4 h-4" />{editing ? 'Guardar Cambios' : 'Crear Aliado'}</button>
        </div>
      </div>
    </div>
  )
}
