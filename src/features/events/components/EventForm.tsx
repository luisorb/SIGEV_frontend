import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { AlertTriangle, MapPin } from 'lucide-react'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Ally, Disbursement, Municipality, Event } from '../../../types'
import { useEventForm } from '../hooks/useEventForm'
import { checkDuplicateEventNumber } from '../utils/duplicateCheck'
import { LocationPicker } from './LocationPicker'

interface EventFormProps {
  event?: Event
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
  events: Event[]
  onSave: (data: EventFormValues) => void
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

export function EventForm({
  event,
  aliados,
  desembolsos,
  municipios,
  events,
  onSave,
  onCancel,
}: EventFormProps) {
  const { register, handleSubmit, errors, isSubmitting, watchedValues, setValue } = useEventForm({
    event,
    onSave,
  })

  const [showPicker, setShowPicker] = useState(false)

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
    <form onSubmit={handleSubmit} className="space-y-8">
      {duplicate && (
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
            <input {...register('responsable')} maxLength={100} className={field('responsable')} placeholder="Nombre del responsable" />
            {errors.responsable && <p className="text-xs text-red-500">{errors.responsable.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Dependencia</label>
            <input {...register('dependencia')} maxLength={100} className={inputBase} placeholder="Ej: Secretaría de Cultura" />
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Fecha del Evento</label>
            <input type="date" {...register('fechaEvento')} className={inputBase} />
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
            <select {...register('municipioId')} className={field('municipioId')}>
              <option value="">Seleccionar municipio</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.departamento})</option>
              ))}
            </select>
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
            <label className={labelBase}>Aliado {requiredMark}</label>
            <select {...register('aliadoId')} className={field('aliadoId')}>
              <option value="">Seleccionar aliado</option>
              {aliados.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
            {errors.aliadoId && <p className="text-xs text-red-500">{errors.aliadoId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className={labelBase}>Desembolso {requiredMark}</label>
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
    </form>
  )
}
