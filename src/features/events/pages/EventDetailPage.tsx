import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { EventForm } from '../components/EventForm'
import { ItemManager } from '../components/ItemManager'
import { ImportExcelModal } from '../components/ImportExcelModal'
import { useItems } from '../hooks/useItems'
import { mockEvents, mockAliados, mockDesembolsos, mockMunicipios } from '../utils/mockData'
import { formatCurrencyCO } from '../../../utils/formatters'
import type { EventFormValues } from '../schemas/eventSchema'
import type { ItemInput } from '../../../types'

export function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'nueva'
  const isView = !!(id && id !== 'nueva' && !window.location.pathname.endsWith('/editar'))

  const event = !isNew ? mockEvents.find((e) => e.id === id) : undefined

  const [showImport, setShowImport] = useState(false)

  const {
    items,
    addItem,
    updateItem,
    removeItem,
    eventTotals,
  } = useItems(
    event?.items.map((i) => ({
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      valorUnitario: i.valorUnitario,
      categoriaTributaria: i.categoriaTributaria,
      aliadoId: i.aliadoId,
    })),
    event?.aliadoId,
  )

  function handleSave(data: EventFormValues) {
    console.log('Guardar evento:', data, items)
    navigate('/ordenes')
  }

  function handleImport(itemsData: ItemInput[]) {
    itemsData.forEach((item) => addItem(item))
  }

  const aliadoName = mockAliados.find((a) => a.id === event?.aliadoId)?.nombre
  const municipioName = mockMunicipios.find((m) => m.id === event?.municipioId)?.nombre

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/ordenes')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a órdenes
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew ? 'Nueva Orden' : isView ? `Orden ${event?.numeroEvento}` : `Editar ${event?.numeroEvento}`}
          </h1>
          {event && (
            <p className="text-sm text-slate-500">
              {aliadoName} · {municipioName} · {event.items.length} ítems
            </p>
          )}
        </div>
        {!isView && (
          <button
            type="submit"
            form="event-form"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        )}
      </div>

      {!isView && (
        <EventForm
          event={event}
          aliados={mockAliados}
          desembolsos={mockDesembolsos}
          municipios={mockMunicipios}
          events={mockEvents}
          onSave={handleSave}
          onCancel={() => navigate('/ordenes')}
        />
      )}

      {isView && event && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Responsable</p>
            <p className="text-sm font-medium text-slate-900">{event.responsable}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Esquema</p>
            <p className="text-sm font-medium text-slate-900 capitalize">{event.esquema}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Estado</p>
            <p className="text-sm font-medium text-slate-900">{event.estado}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrencyCO(eventTotals.granTotal)}</p>
          </div>
        </div>
      )}

      <ItemManager
        items={items}
        aliados={mockAliados}
        onAddItem={isView ? undefined : addItem}
        onUpdateItem={isView ? undefined : updateItem}
        onRemoveItem={isView ? undefined : removeItem}
        eventTotals={eventTotals}
        onOpenImport={isView ? undefined : () => setShowImport(true)}
        readOnly={isView}
      />

      <ImportExcelModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  )
}
