import { AlertTriangle } from 'lucide-react'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Ally, Disbursement, Municipality, Event } from '../../../types'
import { useEventForm } from '../hooks/useEventForm'
import { checkDuplicateEventNumber } from '../utils/duplicateCheck'

interface EventFormProps {
  event?: Event
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
  events: Event[]
  onSave: (data: EventFormValues) => void
  onCancel: () => void
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
  const { register, handleSubmit, errors, isSubmitting, watchedValues } = useEventForm({
    event,
    onSave,
  })

  const duplicate = checkDuplicateEventNumber(
    events,
    watchedValues.numeroEvento,
    watchedValues.sufijo ?? '',
    event?.id,
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">
          {event ? 'Editar Orden' : 'Nueva Orden'}
        </h2>

        {duplicate && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Posible duplicado</p>
              <p className="text-sm text-amber-700">
                Ya existe un evento con el número {duplicate.numeroEvento}{duplicate.sufijo ? `-${duplicate.sufijo}` : ''}.
                Verifica antes de guardar.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Número de Evento <span className="text-red-500">*</span>
            </label>
            <input
              {...register('numeroEvento')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: 2025-001"
            />
            {errors.numeroEvento && (
              <p className="text-xs text-red-500">{errors.numeroEvento.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Sufijo</label>
            <input
              {...register('sufijo')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: A, B, C"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Responsable <span className="text-red-500">*</span>
            </label>
            <input
              {...register('responsable')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del responsable"
            />
            {errors.responsable && (
              <p className="text-xs text-red-500">{errors.responsable.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Dependencia</label>
            <input
              {...register('dependencia')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Secretaría de Cultura"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Fecha del Evento</label>
            <input
              type="date"
              {...register('fechaEvento')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Asistentes</label>
            <input
              type="number"
              min={0}
              {...register('asistentes', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Días</label>
            <input
              type="number"
              min={0}
              {...register('dias', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Municipio <span className="text-red-500">*</span>
            </label>
            <select
              {...register('municipioId')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar municipio</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.departamento})
                </option>
              ))}
            </select>
            {errors.municipioId && (
              <p className="text-xs text-red-500">{errors.municipioId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Vereda</label>
            <input
              {...register('vereda')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre de la vereda (opcional)"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Latitud</label>
            <input
              type="number"
              step="any"
              {...register('latitud', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="4.7110"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Longitud</label>
            <input
              type="number"
              step="any"
              {...register('longitud', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="-74.0721"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Aliado <span className="text-red-500">*</span>
            </label>
            <select
              {...register('aliadoId')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar aliado</option>
              {aliados.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
            {errors.aliadoId && (
              <p className="text-xs text-red-500">{errors.aliadoId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Desembolso <span className="text-red-500">*</span>
            </label>
            <select
              {...register('desembolsoId')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar desembolso</option>
              {desembolsos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
            {errors.desembolsoId && (
              <p className="text-xs text-red-500">{errors.desembolsoId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Esquema <span className="text-red-500">*</span>
            </label>
            <select
              {...register('esquema')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cotizacion">Cotización</option>
              <option value="detalle">Detalle</option>
            </select>
            {errors.esquema && (
              <p className="text-xs text-red-500">{errors.esquema.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Observaciones</label>
          <textarea
            {...register('observaciones')}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Observaciones adicionales del evento..."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {event ? 'Guardar Cambios' : 'Crear Orden'}
        </button>
      </div>
    </form>
  )
}
