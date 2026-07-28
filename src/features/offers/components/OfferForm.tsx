import { useState } from 'react'
import { Save, X } from 'lucide-react'
import type { OfferInput, Offer } from '../types'

interface OfferFormProps {
  offer?: Offer
  onSave: (input: OfferInput) => void
  onCancel: () => void
}

export function OfferForm({ offer, onSave, onCancel }: OfferFormProps) {
  const [input, setInput] = useState<OfferInput>({
    codigo: offer?.codigo ?? '',
    nombre: offer?.nombre ?? '',
    descripcion: offer?.descripcion ?? '',
    cliente: offer?.cliente ?? '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(input)
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
          <label className="block text-sm font-medium text-slate-700">Código</label>
          <input
            type="text"
            required
            value={input.codigo}
            onChange={(e) => setInput((p) => ({ ...p, codigo: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="COT-2025-XXX"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Cliente</label>
          <input
            type="text"
            required
            value={input.cliente}
            onChange={(e) => setInput((p) => ({ ...p, cliente: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nombre del cliente"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Nombre de la oferta</label>
        <input
          type="text"
          required
          value={input.nombre}
          onChange={(e) => setInput((p) => ({ ...p, nombre: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nombre descriptivo"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">Descripción</label>
        <textarea
          value={input.descripcion}
          onChange={(e) => setInput((p) => ({ ...p, descripcion: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Detalle del alcance de la oferta"
        />
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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>
      </div>
    </form>
  )
}
