import { useState } from 'react'
import { CalendarRange, Loader2, Save, X } from 'lucide-react'
import { useCreateEventCatalog, useUpdateEventCatalog } from '../../../hooks/useEventCatalogs'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import type { EventCatalog } from '../../../types'

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

function sanitizeName(value: string): string {
  return value
    .replace(/^[\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+$/, '')
    .slice(0, 100)
}

function sanitizeNameLive(value: string): string {
  return value
    .replace(/^[\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 100)
}

interface EventCatalogModalProps {
  open: boolean
  editing?: EventCatalog | null
  eventos: EventCatalog[]
  onClose: () => void
  onCreated?: (name: string) => void
}

export function EventCatalogModal({ open, editing, eventos, onClose, onCreated }: EventCatalogModalProps) {
  const toast = useToast()
  const createEvento = useCreateEventCatalog()
  const updateEvento = useUpdateEventCatalog()
  const [name, setName] = useState(editing?.nombre ?? '')
  const [fieldError, setFieldError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

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
        toast.showToast(`Evento "${payload.name}" actualizado correctamente`)
      } else {
        const created = await createEvento.mutateAsync(payload)
        toast.showToast(`Evento "${payload.name}" creado correctamente`)
        onCreated?.(created.name)
      }
      onClose()
    } catch (err) {
      toast.showToast(getApiErrorMessage(err, 'Error al guardar el evento. Intenta nuevamente.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-lg w-full max-h-[90dvh] animate-[slideInUp_200ms_ease-out] sm:animate-[scaleIn_200ms_ease-out] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
              <CalendarRange className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-base font-bold text-slate-900 truncate">{editing ? 'Editar Evento' : 'Nuevo Evento'}</h3>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 disabled:opacity-40">
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
              onChange={(e) => { setName(sanitizeNameLive(e.target.value)); if (fieldError) setFieldError('') }}
              placeholder="Ej: MESA DE TRABAJO"
              className={fieldError ? inputBase + ' ' + inputError : inputBase}
              disabled={saving}
            />
            {fieldError && <p className="text-xs text-red-500 mt-1">{fieldError}</p>}
            <p className="text-xs text-slate-400">Mínimo 3 caracteres y máximo 100. Sin espacios al inicio ni al final y máximo un espacio entre palabras.</p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <button onClick={onClose} disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-40">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Guardando...' : (editing ? 'Guardar Cambios' : 'Crear Evento')}
          </button>
        </div>
      </div>
    </div>
  )
}