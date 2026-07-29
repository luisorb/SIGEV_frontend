import { Save, X } from 'lucide-react'
import { useOfferForm } from '../hooks/useOfferForm'
import type { Offer } from '../types'

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
  const { register, handleSubmit, errors, isSubmitting } = useOfferForm({ offer, initialData, onSave })

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

      <details className="border border-slate-200 rounded-lg">
        <summary className="px-4 py-2.5 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-50 select-none rounded-lg">
          Datos del evento asociado (opcional)
        </summary>
        <div className="p-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">N° Evento</label>
            <input type="text" {...register('numeroEvento')} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary" placeholder="EV-2025-XXX" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Responsable</label>
            <input type="text" {...register('responsable')} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary" placeholder="Nombre del responsable" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Dependencia</label>
            <input type="text" {...register('dependencia')} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary" placeholder="Dependencia" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Municipio</label>
            <input type="text" {...register('municipio')} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary" placeholder="Municipio" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Aliado</label>
            <input type="text" {...register('aliado')} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary" placeholder="Aliado" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Desembolso</label>
            <input type="text" {...register('desembolso')} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary" placeholder="Desembolso" />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500">Esquema</label>
            <select {...register('esquema')} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary">
              <option value="">Seleccionar</option>
              <option value="cotizacion">Cotización</option>
              <option value="detalle">Detalle</option>
            </select>
          </div>
        </div>
      </details>

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
