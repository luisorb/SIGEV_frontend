import { useMemo } from 'react'
import { Save, X, FileSpreadsheet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useOfferForm } from '../hooks/useOfferForm'
import type { Offer } from '../types'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'

interface OfferFormProps {
  offer?: Offer
  initialData?: Partial<{
    eventoId: string
    numeroEvento: string
    responsable: string
    dependencia: string
    municipio: string
    aliado: string
    desembolso: string
    esquema: string
  }>
  onSave: (data: {
    codigo: string
    nombre: string
    descripcion: string
    cliente: string
    eventoId?: string
    numeroEvento?: string
    responsable?: string
    dependencia?: string
    municipio?: string
    aliado?: string
    desembolso?: string
    esquema?: string
  }) => void
  onCancel: () => void
}

export function OfferForm({ offer, initialData, onSave, onCancel }: OfferFormProps) {
  const { register, handleSubmit, errors, isSubmitting, form } = useOfferForm({ offer, initialData, onSave })
  const { data: allEvents = [] } = useQuery({ queryKey: ['events'], queryFn: () => import('../../../services/events.service').then(m => m.getEventsApi()) })
  const events = useMemo(() => allEvents.filter(e => e.activo !== false), [allEvents])
  const { data: aliadosList = [] } = useAllies()
  const { data: desembolsosList = [] } = useDisbursements()

  function handleEventSelect(eventId: string) {
    if (!eventId) {
      form.setValue('eventoId', '')
      form.setValue('numeroEvento', '')
      form.setValue('responsable', '')
      form.setValue('dependencia', '')
      form.setValue('municipio', '')
      form.setValue('aliado', '')
      form.setValue('desembolso', '')
      form.setValue('esquema', '')
      return
    }
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    const municipio = ev.municipioId
    const a = aliadosList.find((a) => a.id === ev.aliadoId)
    const aliado = a ? a.nombre : ev.aliadoId
    const d = desembolsosList.find((d) => d.id === ev.desembolsoId)
    const desembolso = d ? d.nombre : ev.desembolsoId
    form.setValue('eventoId', ev.id)
    form.setValue('numeroEvento', `${ev.numeroEvento}${ev.sufijo ? `-${ev.sufijo}` : ''}`)
    form.setValue('responsable', ev.responsable)
    form.setValue('dependencia', ev.dependencia || '')
    form.setValue('municipio', municipio)
    form.setValue('aliado', aliado)
    form.setValue('desembolso', desembolso)
    form.setValue('esquema', ev.esquema)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {offer ? 'Editar Oferta' : 'Nueva Oferta'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Código <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('codigo')}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.codigo ? 'border-red-400 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="COT-2025-XXX"
          />
          {errors.codigo && (
            <p className="text-xs text-red-600 mt-0.5">{errors.codigo.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Cliente <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('cliente')}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.cliente ? 'border-red-400 bg-red-50' : 'border-slate-300'
            }`}
            placeholder="Nombre del cliente"
          />
          {errors.cliente && (
            <p className="text-xs text-red-600 mt-0.5">{errors.cliente.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          Nombre de la oferta <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('nombre')}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${
            errors.nombre ? 'border-red-400 bg-red-50' : 'border-slate-300'
          }`}
          placeholder="Nombre descriptivo"
        />
        {errors.nombre && (
          <p className="text-xs text-red-600 mt-0.5">{errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Descripción</label>
        <textarea
          {...register('descripcion')}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="Detalle del alcance de la oferta"
        />
      </div>

      <div className="border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-slate-500" />
          <label className="text-sm font-medium text-slate-700">Evento asociado (opcional)</label>
        </div>
        <select
          value={form.watch('eventoId') || ''}
          onChange={(e) => handleEventSelect(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Sin evento asociado</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.numeroEvento}{ev.sufijo ? `-${ev.sufijo}` : ''} - {ev.responsable} ({ev.estado})
            </option>
          ))}
        </select>
        {form.watch('eventoId') && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <span className="text-xs text-slate-400">Responsable</span>
              <p className="font-medium text-slate-800">{form.watch('responsable')}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Municipio</span>
              <p className="font-medium text-slate-800">{form.watch('municipio')}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Aliado</span>
              <p className="font-medium text-slate-800">{form.watch('aliado')}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Esquema</span>
              <p className="font-medium text-slate-800 capitalize">{form.watch('esquema')}</p>
            </div>
          </div>
        )}
        <input type="hidden" {...register('eventoId')} />
        <input type="hidden" {...register('numeroEvento')} />
        <input type="hidden" {...register('responsable')} />
        <input type="hidden" {...register('dependencia')} />
        <input type="hidden" {...register('municipio')} />
        <input type="hidden" {...register('aliado')} />
        <input type="hidden" {...register('desembolso')} />
        <input type="hidden" {...register('esquema')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>
      </div>
    </form>
  )
}
