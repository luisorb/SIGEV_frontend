import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle,
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Lock,
  MapPin,
  Plus,
  Upload,
  Wallet,
} from 'lucide-react'
import { DEPENDENCIAS } from '../../../config/constants'
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

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

const STEPS = [
  { key: 'datos', label: 'Datos del evento', icon: ClipboardList },
  { key: 'ubicacion', label: 'Ubicación', icon: MapPin },
  { key: 'recursos', label: 'Recursos', icon: Wallet },
  { key: 'adjunto', label: 'Adjunto', icon: FileText },
] as const

type StepKey = (typeof STEPS)[number]['key']

const STEP_FIELDS: Record<StepKey, (keyof EventFormValues)[]> = {
  datos: ['numeroEvento', 'sufijo', 'responsable', 'dependencia', 'fechaEvento', 'asistentes', 'dias'],
  ubicacion: ['municipioId', 'vereda', 'latitud', 'longitud'],
  recursos: ['aliadoId', 'desembolsoId', 'esquema', 'observaciones'],
  adjunto: [],
}

interface FieldProps {
  id: string
  label: string
  className?: string
  required?: boolean
  optional?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

function Field({ id, label, className, required, optional, hint, error, children }: FieldProps) {
  return (
    <div className={['space-y-1.5', className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className="flex items-center justify-between gap-2">
        <span className={labelBase}>
          {label}
          {required && requiredMark}
        </span>
        {optional && !required && (
          <span className="text-xs font-normal text-slate-400">Opcional</span>
        )}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1 text-xs text-red-500">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : undefined, error ? `${id}-error` : undefined].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

interface StepCardProps {
  icon: typeof ClipboardList
  title: string
  subtitle: string
  notice?: ReactNode
  children: ReactNode
}

function StepCard({ icon: Icon, title, subtitle, notice, children }: StepCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-[slideInUp_250ms_ease-out] motion-reduce:animate-none">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
        <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      {notice}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
        {children}
      </div>
    </div>
  )
}

function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

    const icon = L.divIcon({
      className: '',
      html: '<div style="width:18px;height:18px;background:#E11D48;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })

    const marker = L.marker([lat, lng], { icon, interactive: false }).addTo(map)
    mapRef.current = map
    markerRef.current = marker

    const t = window.setTimeout(() => map.invalidateSize(), 80)
    return () => {
      window.clearTimeout(t)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map) return
    map.setView([lat, lng], 15)
    marker?.setLatLng([lat, lng])
  }, [lat, lng])

  return <div ref={containerRef} className="w-full h-44 z-0 bg-slate-100" />
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
  const { register, handleSubmit: submitForm, errors, isSubmitting, watchedValues, setValue, trigger } = useEventForm({
    event,
    onSave: (data) => {
      const error = validateRequerimiento()
      setRequerimientoError(error)
      if (error) return
      onSave(data, requerimientoFile)
    },
  })

  const [stepIndex, setStepIndex] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [requerimientoFile, setRequerimientoFile] = useState<File | null>(null)
  const [requerimientoError, setRequerimientoError] = useState<string | null>(null)
  const [allyModalOpen, setAllyModalOpen] = useState(false)
  const [submitArmed, setSubmitArmed] = useState(false)
  const [dragging, setDragging] = useState(false)
  const formTopRef = useRef<HTMLFormElement>(null)
  const navigatingRef = useRef(false)

  useEffect(() => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [stepIndex])

  const submitArmTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (submitArmTimerRef.current !== null) window.clearTimeout(submitArmTimerRef.current)
    }
  }, [])

  function armSubmit() {
    setSubmitArmed(false)
    if (submitArmTimerRef.current !== null) window.clearTimeout(submitArmTimerRef.current)
    submitArmTimerRef.current = window.setTimeout(() => setSubmitArmed(true), 400)
  }

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

  function handleRequerimientoFile(file: File | null) {
    setRequerimientoFile(file)
    setRequerimientoError(file ? requerimientoFileError(file) : null)
  }

  function clearCoordinates() {
    setValue('latitud', '' as unknown as EventFormValues['latitud'], { shouldValidate: true })
    setValue('longitud', '' as unknown as EventFormValues['longitud'], { shouldValidate: true })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== 'Enter') return
    const target = event.target as HTMLElement
    if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') return
    event.preventDefault()
    if (stepIndex < STEPS.length - 1) {
      void handleNext()
    }
  }

  async function handleNext() {
    if (navigatingRef.current) return
    navigatingRef.current = true
    try {
      const fields = STEP_FIELDS[STEPS[stepIndex].key]
      const valid = fields.length > 0 ? await trigger(fields as never) : true
      if (valid) {
        const next = Math.min(stepIndex + 1, STEPS.length - 1)
        setStepIndex(next)
        if (next === STEPS.length - 1) armSubmit()
      }
    } finally {
      navigatingRef.current = false
    }
  }

  async function handleStepClick(target: number) {
    if (target === stepIndex || navigatingRef.current) return
    if (target < stepIndex) {
      setStepIndex(target)
      return
    }
    navigatingRef.current = true
    try {
      const fieldsToValidate: (keyof EventFormValues)[] = []
      for (let i = stepIndex; i < target; i++) {
        fieldsToValidate.push(...STEP_FIELDS[STEPS[i].key])
      }
      const valid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate as never) : true
      if (valid) {
        setStepIndex(target)
        if (target === STEPS.length - 1) armSubmit()
      }
    } finally {
      navigatingRef.current = false
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(i - 1, 0))
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

  const duplicateNotice = duplicate ? (
    <div className="mx-6 mt-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Posible duplicado</p>
        <p className="text-sm text-amber-700 mt-0.5">
          Ya existe un evento con el número {duplicate.numeroEvento}{duplicate.sufijo ? `-${duplicate.sufijo}` : ''}.
          Verifica antes de guardar.
        </p>
      </div>
    </div>
  ) : undefined

  const latValue = watchedValues.latitud
  const lngValue = watchedValues.longitud
  const hasCoords = [latValue, lngValue].every(
    (v) => v !== undefined && v !== null && String(v).trim() !== '' && Number.isFinite(Number(v)),
  )
  const lat = hasCoords ? Number(latValue) : 0
  const lng = hasCoords ? Number(lngValue) : 0

  return (
    <form ref={formTopRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6 scroll-mt-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden px-6 py-5">
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-1 bg-slate-100 rounded-full" />
          <div
            className="absolute top-4 left-0 h-1 bg-gradient-to-r from-primary to-primary-dark rounded-full shadow-sm transition-all duration-500 ease-out"
            style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
          />
          <div className="relative flex items-start justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = index < stepIndex
              const isCurrent = index === stepIndex
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => handleStepClick(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={step.label}
                  className="flex flex-1 flex-col items-center rounded-lg cursor-pointer transition-opacity"
                >
                  <span
                    className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                      isCurrent
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                        : isCompleted
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-white border-2 border-primary/40 text-primary/80'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </span>
                  <span
                    className={`mt-2 text-xs leading-tight text-center transition-colors duration-300 ${
                      isCurrent ? 'text-primary font-semibold' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {stepIndex === 0 && (
        <StepCard
          icon={ClipboardList}
          title="Datos del evento"
          subtitle="Identificación y programación del evento."
          notice={duplicateNotice}
        >
          <Field
            id="numeroEvento"
            label="Número de Evento"
            required
            hint="Ej: 2025-001. Identificador único de la orden en el sistema."
            error={errors.numeroEvento?.message}
          >
            <input
              id="numeroEvento"
              {...register('numeroEvento')}
              maxLength={100}
              aria-describedby={describedBy('numeroEvento', 'Ej: 2025-001. Identificador único de la orden en el sistema.', errors.numeroEvento?.message)}
              className={field('numeroEvento')}
              placeholder="Ej: 2025-001"
            />
          </Field>
          <Field
            id="sufijo"
            label="Sufijo"
            optional
            hint="Ej: A, B, C. Úsalo cuando un mismo evento se divide en varias órdenes."
          >
            <input
              id="sufijo"
              {...register('sufijo')}
              maxLength={100}
              aria-describedby="sufijo-hint"
              className={inputBase}
              placeholder="Ej: A, B, C"
            />
          </Field>
          <Field
            id="responsable"
            label="Responsable"
            required
            hint="Se asigna automáticamente al usuario que crea la orden."
          >
            <input
              id="responsable"
              {...register('responsable')}
              readOnly
              maxLength={100}
              aria-describedby="responsable-hint"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-slate-50 cursor-not-allowed"
            />
            {errors.responsable && <p className="text-xs text-red-500">{errors.responsable.message}</p>}
          </Field>
          <Field
            id="dependencia"
            label="Dependencia"
            optional
            hint="Dependencia interna que solicita la orden."
          >
            <select id="dependencia" {...register('dependencia')} className={field('dependencia')}>
              <option value="">Seleccionar dependencia</option>
              {DEPENDENCIAS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
              {event && event.dependencia && !(DEPENDENCIAS as readonly string[]).includes(event.dependencia) && (
                <option value={event.dependencia}>{event.dependencia}</option>
              )}
            </select>
          </Field>
          <Field
            id="fechaEvento"
            label="Fecha del Evento"
            required
            hint="Fecha en la que se ejecutará el evento."
            error={errors.fechaEvento?.message}
          >
            <input
              id="fechaEvento"
              type="date"
              {...register('fechaEvento')}
              aria-describedby={describedBy('fechaEvento', 'Fecha en la que se ejecutará el evento.', errors.fechaEvento?.message)}
              className={inputBase}
            />
          </Field>
          <Field
            id="asistentes"
            label="Asistentes"
            optional
            hint="Número estimado de personas que participarán."
          >
            <input
              id="asistentes"
              type="number"
              min={0}
              {...numericField('asistentes')}
              aria-describedby="asistentes-hint"
              className={inputBase}
              placeholder="0"
            />
          </Field>
          <Field
            id="dias"
            label="Días"
            optional
            hint="Duración estimada del evento en días."
          >
            <input
              id="dias"
              type="number"
              min={0}
              {...numericField('dias')}
              aria-describedby="dias-hint"
              className={inputBase}
              placeholder="0"
            />
          </Field>
        </StepCard>
      )}

      {stepIndex === 1 && (
        <StepCard
          icon={MapPin}
          title="Ubicación"
          subtitle="Lugar donde se ejecutará el evento."
        >
          <Field
            id="municipioId"
            label="Municipio"
            className="md:col-span-2 lg:col-span-3"
            required
            hint="Municipio del evento. Escribe para buscar por nombre o departamento."
            error={errors.municipioId?.message}
          >
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
          </Field>

          <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={labelBase}>
                Punto en el mapa
                {hasCoords && (
                  <span className="inline-flex items-center gap-1 ml-1.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    fijado
                  </span>
                )}
              </span>
              {!hasCoords && (
                <span className="text-xs font-normal text-slate-400">Opcional</span>
              )}
            </div>

            {hasCoords ? (
              <div className="rounded-xl border border-green-200 bg-green-50/40 overflow-hidden">
                <div className="relative">
                  <MapPreview lat={lat} lng={lng} />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-semibold text-green-700 border border-green-200 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Punto fijado
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                  <p className="text-xs text-slate-600 font-mono">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPicker(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-white border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Cambiar punto
                    </button>
                    <button
                      type="button"
                      onClick={clearCoordinates}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-300 hover:border-primary/40 hover:bg-slate-50 transition-all duration-150">
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="w-full flex flex-col items-center gap-2 py-6 px-4 text-center"
                >
                  <span className="p-3 rounded-full bg-primary/10 text-primary">
                    <MapPin className="w-6 h-6" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">Seleccionar punto en el mapa</span>
                  <span className="text-xs text-slate-400">Abre el mapa para fijar la ubicación exacta del evento</span>
                </button>
              </div>
            )}
          </div>

          <Field
            id="vereda"
            label="Vereda"
            optional
            hint="Corregimiento o vereda, si el evento es en zona rural."
          >
            <input
              id="vereda"
              {...register('vereda')}
              maxLength={100}
              aria-describedby="vereda-hint"
              className={inputBase}
              placeholder="Nombre de la vereda (opcional)"
            />
          </Field>
          <Field
            id="latitud"
            label="Latitud"
            optional
            hint="Se completa al elegir el punto en el mapa."
          >
            <input
              id="latitud"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              readOnly
              {...coordinateField('latitud')}
              aria-describedby="latitud-hint"
              className={[inputBase, 'bg-slate-50 text-slate-600 cursor-not-allowed'].join(' ')}
              placeholder="4.7110"
            />
          </Field>
          <Field
            id="longitud"
            label="Longitud"
            optional
            hint="Se completa al elegir el punto en el mapa."
          >
            <input
              id="longitud"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              readOnly
              {...coordinateField('longitud')}
              aria-describedby="longitud-hint"
              className={[inputBase, 'bg-slate-50 text-slate-600 cursor-not-allowed'].join(' ')}
              placeholder="-74.0721"
            />
          </Field>
        </StepCard>
      )}

      {stepIndex === 2 && (
        <StepCard
          icon={Wallet}
          title="Recursos"
          subtitle="Aliado, financiación y esquema de ejecución."
        >
          <Field
            id="aliadoId"
            label="Aliado"
            optional
            hint="Aliado que ejecutará los ítems del evento. Si no existe, puedes crearlo."
          >
            <div className="flex items-start gap-2">
              <select id="aliadoId" {...register('aliadoId')} className={field('aliadoId')}>
                <option value="">Seleccionar aliado</option>
                {aliados.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAllyModalOpen(true)}
                title="Crear nuevo aliado"
                aria-label="Crear nuevo aliado"
                className="inline-flex items-center justify-center w-11 h-[42px] shrink-0 text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {errors.aliadoId && <p className="text-xs text-red-500">{errors.aliadoId.message}</p>}
          </Field>
          <Field
            id="desembolsoId"
            label="Recurso disponible"
            required
            hint="Recurso disponible con el que se financia la orden."
            error={errors.desembolsoId?.message}
          >
            <select
              id="desembolsoId"
              {...register('desembolsoId')}
              aria-describedby={describedBy('desembolsoId', 'Recurso disponible con el que se financia la orden.', errors.desembolsoId?.message)}
              className={field('desembolsoId')}
            >
              <option value="">Seleccionar desembolso</option>
              {desembolsos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </Field>
          <Field
            id="esquema"
            label="Esquema"
            required
            hint="Cotización: se selecciona una oferta ganadora. Detalle: los ítems se cargan manualmente."
            error={errors.esquema?.message}
          >
            <select
              id="esquema"
              {...register('esquema')}
              aria-describedby={describedBy('esquema', 'Cotización: se selecciona una oferta ganadora. Detalle: los ítems se cargan manualmente.', errors.esquema?.message)}
              className={field('esquema')}
            >
              <option value="">Seleccionar esquema</option>
              <option value="cotizacion">Cotización</option>
              <option value="detalle">Detalle</option>
            </select>
          </Field>
          <div className="md:col-span-2 lg:col-span-3">
            <Field
              id="observaciones"
              label="Observaciones"
              optional
              hint="Información adicional que quedará visible en el detalle de la orden."
            >
              <textarea
                id="observaciones"
                {...register('observaciones')}
                maxLength={1000}
                rows={4}
                aria-describedby="observaciones-hint"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 resize-none"
                placeholder="Observaciones adicionales del evento..."
              />
            </Field>
          </div>
        </StepCard>
      )}

      {stepIndex === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-[slideInUp_250ms_ease-out] motion-reduce:animate-none">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-slate-700">
                  Formato de requerimiento {requiredMark}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Documento oficial de solicitud del evento. Solo puede cargarse aquí; en el detalle de la orden solo es posible descargarlo.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/5 text-primary border border-primary/20">
              <FileText className="w-3.5 h-3.5" />
              PDF · máx {MAX_REQUERIMIENTO_MB} MB
            </span>
          </div>
          <div className="px-6 py-5 space-y-4">
            {requerimientoLocked && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Lock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Documento inmutable</p>
                  <p className="text-sm text-amber-700/80 mt-0.5">
                    La cotización fue aprobada y se creó el presupuesto final, por lo que el Formato de requerimiento no puede modificarse.
                  </p>
                </div>
              </div>
            )}

            {existingRequerimiento && !requerimientoFile && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-slate-200 bg-slate-50 rounded-xl">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">{existingRequerimiento.originalName}</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-red-500 uppercase tracking-wide shrink-0">
                        PDF
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatFileSize(existingRequerimiento.fileSize)} · Cargado el {formatDateCO(existingRequerimiento.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadAttachment(existingRequerimiento.id, existingRequerimiento.originalName)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-white border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
              </div>
            )}

            {requerimientoLocked ? (
              <p className="text-xs text-slate-400">
                Este documento es parte del presupuesto aprobado y no puede reemplazarse.
              </p>
            ) : (
              <div className="space-y-3">
                <label
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (!dragging) setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    handleRequerimientoFile(e.dataTransfer.files?.[0] ?? null)
                  }}
                  className={`block w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150 ${
                    dragging
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : requerimientoFile
                        ? 'border-green-400/60 bg-green-50/60'
                        : 'border-slate-300 hover:border-primary/40 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      handleRequerimientoFile(e.target.files?.[0] ?? null)
                      e.target.value = ''
                    }}
                  />
                  {requerimientoFile ? (
                    <span className="flex items-center gap-3 px-4 py-4 text-left min-w-0">
                      <span className="shrink-0 w-10 h-10 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-700" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900 truncate">{requerimientoFile.name}</span>
                        <span className="block text-xs text-slate-500">
                          {formatFileSize(requerimientoFile.size)} · Haz clic para elegir otro archivo
                        </span>
                      </span>
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-1.5 px-4 py-5 text-center w-full">
                      <span className="p-2.5 rounded-full bg-primary/10 text-primary">
                        <Upload className="w-5 h-5" />
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {existingRequerimiento ? 'Reemplazar formato de requerimiento' : 'Cargar formato de requerimiento'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Arrastra el archivo PDF aquí o haz clic para seleccionarlo
                      </span>
                    </span>
                  )}
                </label>

                {requerimientoFile && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Archivo listo para guardar.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRequerimientoFile(null)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            )}

            {requerimientoError && (
              <p className="flex items-start gap-1 text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>{requerimientoError}</span>
              </p>
            )}
            {!requerimientoLocked && existingRequerimiento && requerimientoFile && (
              <p className="flex items-start gap-1 text-xs text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <span>Al guardar, el archivo actual será reemplazado por el nuevo.</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
        >
          Cancelar
        </button>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>
          {stepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!submitArmed || isSubmitting}
              onClick={() => void submitForm()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-150"
            >
              <Check className="w-4 h-4" />
              {event ? 'Guardar Cambios' : 'Crear Orden'}
            </button>
          )}
        </div>
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
