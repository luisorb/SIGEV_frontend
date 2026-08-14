import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { AlertTriangle, MapPin, FileText, Download, Upload, Lock, Plus } from 'lucide-react'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Ally, Disbursement, Municipality, Event, Attachment } from '../../../types'
import { useEventForm } from '../hooks/useEventForm'
import { checkDuplicateEventNumber } from '../utils/duplicateCheck'
import { LocationPicker } from './LocationPicker'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { AllyFormModal } from '../../../components/AllyFormModal'
import { downloadAttachment } from '../../../services/attachments.service'
import { formatDateCO } from '../../../utils/formatters'

interface EventFormProps {
  event?: Event
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
  events: Event[]
  onSave: (data: EventFormValues, file?: File | null) => void
  onCancel: () => void
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

const MAX_REQUERIMIENTO_MB = 10
const MAX_REQUERIMIENTO_BYTES = MAX_REQUERIMIENTO_MB * 1024 * 1024

function requerimientoFileError(file: File): string | null {
  const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Solo se admiten archivos PDF'
  if (file.size > MAX_REQUERIMIENTO_BYTES) {
    return `El documento PDF no puede superar los ${MAX_REQUERIMIENTO_MB} MB`
  }
  return null
}

export function EventForm({
  event,
  aliados,
  desembolsos,
  municipios,
  events,
  onSave,
  onCancel,
}: EventFormProps) {
  const { register, handleSubmit: submitForm, errors, isSubmitting, watchedValues, setValue } = useEventForm({
    event,
    onSave: (data) => {
      const error = validateRequerimiento()
      setRequerimientoError(error)
      if (error) return
      onSave(data, requerimientoFile)
    },
  })

  const [showPicker, setShowPicker] = useState(false)
  const [requerimientoFile, setRequerimientoFile] = useState<File | null>(null)
  const [requerimientoError, setRequerimientoError] = useState<string | null>(null)
  const [allyModalOpen, setAllyModalOpen] = useState(false)

  const existingRequerimiento: Attachment | undefined = event?.attachments?.find(
    (a) => a.category === 'Formato de requerimiento',
  )
  const requerimientoLocked = !!event?.cotizacionSeleccionadaId

  const hasRequerimiento = !!requerimientoFile || !!existingRequerimiento || requerimientoLocked

  function validateRequerimiento(): string | null {
    if (requerimientoLocked) return null
    if (!hasRequerimiento) return 'El formato de requerimiento es obligatorio'
    if (requerimientoFile) return requerimientoFileError(requerimientoFile)
    return null
  }

  function handleAllySaved(ally: Ally) {
    setValue('aliadoId', ally.id, { shouldValidate: true })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitForm()
  }

  const duplicate = checkDuplicateEventNumber(
    events,
    watchedValues.numeroEvento ?? '',
    watchedValues.sufijo ?? '',
    event?.id,
  )

  function field(name: keyof typeof errors) {
    return errors[name] ? inputBase + ' ' + inputError : inputBase
  }

  function numericField(name: 'dias' | 'asistentes') {
    const { onChange, ...rest } = register(name, { valueAsNumber: true })
    return {
      ...rest,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.value.length > 15) e.target.value = e.target.value.slice(0, 15)
        onChange(e)
      },
    }
  }

  function coordinateField(name: 'latitud' | 'longitud') {
    const { onChange, ...rest } = register(name)
    return {
      ...rest,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        const negative = raw.trimStart().startsWith('-')
        let value = raw.replace(/[^0-9.]/g, '')
        const dotIndex = value.indexOf('.')
        if (dotIndex !== -1) {
          value = value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '')
        }
        value = (negative ? '-' : '') + value
        value = value.slice(0, 15)
        e.target.value = value
        onChange(e)
      },
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">      {duplicate && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Posible duplicado</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Ya existe un evento con el número {duplicate.numeroEvento}{duplicate.sufijo ? `-${duplicate.sufijo}` : ''}.
              Verifica antes de guardar.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          <div className="space-y-1.5">
            <label className={labelBase}>Número de Evento {requiredMark}</label>
            <input {...register('numeroEvento')} maxLength={100} className={field('numeroEvento')} placeholder="Ej: 2025-001" />
            {errors.numeroEvento && <p className="text-xs text-red-500">{errors.numeroEvento.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Sufijo</label>
            <input {...register('sufijo')} maxLength={100} className={inputBase} placeholder="Ej: A, B, C" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Responsable {requiredMark}</label>
            <input
              {...register('responsable')}
              readOnly
              maxLength={100}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed"
            />
            {errors.responsable && <p className="text-xs text-red-500">{errors.responsable.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Dependencia</label>
            <input {...register('dependencia')} maxLength={100} className={inputBase} placeholder="Ej: Secretaría de Cultura" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Fecha del Evento {requiredMark}</label>
            <input type="date" {...register('fechaEvento')} className={inputBase} />
            {errors.fechaEvento && <p className="text-xs text-red-500">{errors.fechaEvento.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Asistentes</label>
            <input type="number" min={0} {...numericField('asistentes')} className={inputBase} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Días</label>
            <input type="number" min={0} {...numericField('dias')} className={inputBase} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Municipio {requiredMark}</label>
            <SearchableSelect
              options={municipios.map((m) => ({
                value: m.id,
                label: `${m.nombre} (${m.departamento})`,
                keywords: `${m.nombre} ${m.departamento}`,
              }))}
              value={watchedValues.municipioId ?? ''}
              onChange={(municipioId) => setValue('municipioId', municipioId, { shouldValidate: true })}
              placeholder="Buscar municipio..."
              error={!!errors.municipioId}
            />
            {errors.municipioId && <p className="text-xs text-red-500">{errors.municipioId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Vereda</label>
            <input {...register('vereda')} maxLength={100} className={inputBase} placeholder="Nombre de la vereda (opcional)" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Ubicación en el mapa</label>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              Seleccionar ubicación en el mapa
            </button>
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Latitud</label>
            <input type="text" inputMode="decimal" autoComplete="off" {...coordinateField('latitud')} className={inputBase} placeholder="4.7110" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Longitud</label>
            <input type="text" inputMode="decimal" autoComplete="off" {...coordinateField('longitud')} className={inputBase} placeholder="-74.0721" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Aliado <span className="text-xs font-normal text-slate-400">(opcional)</span></label>
            <div className="flex items-start gap-2">
              <select {...register('aliadoId')} className={field('aliadoId')}>
                <option value="">Seleccionar aliado</option>
                {aliados.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAllyModalOpen(true)}
                title="Crear nuevo aliado"
                className="inline-flex items-center justify-center w-11 h-[42px] shrink-0 text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {errors.aliadoId && <p className="text-xs text-red-500">{errors.aliadoId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Recurso disponible {requiredMark}</label>
            <select {...register('desembolsoId')} className={field('desembolsoId')}>
              <option value="">Seleccionar desembolso</option>
              {desembolsos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
            {errors.desembolsoId && <p className="text-xs text-red-500">{errors.desembolsoId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Esquema {requiredMark}</label>
            <select {...register('esquema')} className={field('esquema')}>
              <option value="">Seleccionar esquema</option>
              <option value="cotizacion">Cotización</option>
              <option value="detalle">Detalle</option>
            </select>
            {errors.esquema && <p className="text-xs text-red-500">{errors.esquema.message}</p>}
          </div>
          <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
            <label className={labelBase}>Observaciones</label>
            <textarea
              {...register('observaciones')}
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 resize-none"
              placeholder="Observaciones adicionales del evento..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              <FileText className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Formato de requerimiento {requiredMark}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Documento oficial de solicitud del evento. Solo se admite un archivo PDF de máximo {MAX_REQUERIMIENTO_MB} MB. Solo puede cargarse aquí; en el detalle de la orden solo es posible descargarlo.
          </p>
        </div>
        <div className="px-6 py-5">
          {requerimientoLocked && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
              <Lock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Documento inmutable</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  La cotización fue aprobada y se creó el presupuesto final, por lo que el Formato de requerimiento no puede modificarse.
                </p>
              </div>
            </div>
          )}

          {existingRequerimiento && (
            <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{existingRequerimiento.originalName}</p>
                  <p className="text-xs text-slate-400">
                    {(existingRequerimiento.fileSize / 1024).toFixed(1)} KB · {formatDateCO(existingRequerimiento.createdAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadAttachment(existingRequerimiento.id, existingRequerimiento.originalName)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar
              </button>
            </div>
          )}

          <div className={`flex items-center gap-3 ${requerimientoLocked ? 'opacity-50' : ''}`}>
            <label
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border border-dashed rounded-xl cursor-pointer transition-colors ${
                requerimientoFile
                  ? 'border-primary/40 bg-primary/5 text-primary'
                  : 'border-slate-300 text-slate-500 hover:border-primary/40 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4 shrink-0" />
              {requerimientoFile
                ? requerimientoFile.name
                : existingRequerimiento
                  ? 'Reemplazar formato de requerimiento (PDF)'
                  : 'Cargar formato de requerimiento (PDF)'}
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                disabled={requerimientoLocked}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setRequerimientoFile(file)
                  setRequerimientoError(file ? requerimientoFileError(file) : null)
                  e.target.value = ''
                }}
              />
            </label>
            {requerimientoFile && !requerimientoLocked && (
              <button
                type="button"
                onClick={() => {
                  setRequerimientoFile(null)
                  setRequerimientoError(null)
                }}
                className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              >
                Quitar
              </button>
            )}
          </div>
          {requerimientoError && (
            <p className="text-xs text-red-500 mt-2">{requerimientoError}</p>
          )}
          {!requerimientoLocked && existingRequerimiento && requerimientoFile && (
            <p className="text-xs text-amber-600 mt-2">
              Al guardar, el archivo actual será reemplazado por el nuevo.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-150"
        >
          {event ? 'Guardar Cambios' : 'Crear Orden'}
        </button>
      </div>

      {showPicker && (
        <LocationPicker
          latitud={watchedValues.latitud}
          longitud={watchedValues.longitud}
          municipio={municipios.find((m) => m.id === watchedValues.municipioId)}
          onSelect={(lat, lng) => {
            setValue('latitud', lat, { shouldValidate: true })
            setValue('longitud', lng, { shouldValidate: true })
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      <AllyFormModal
        open={allyModalOpen}
        onClose={() => setAllyModalOpen(false)}
        onSaved={handleAllySaved}
        showEstado={false}
      />
    </form>
  )
}
