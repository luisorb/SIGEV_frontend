import { useState } from 'react'
import { Modal } from '../../../layout/Modal'
import { EventForm } from './EventForm'
import { ItemManager } from './ItemManager'
import { ImportExcelModal } from './ImportExcelModal'
import { useItems } from '../hooks/useItems'
import { mockEvents, mockAliados, mockDesembolsos, mockMunicipios } from '../utils/mockData'
import { formatCurrencyCO } from '../../../utils/formatters'
import type { EventFormValues } from '../schemas/eventSchema'
import type { ItemInput } from '../../../types'

type ModalMode = 'create' | 'view' | 'edit'

interface EventDetailModalProps {
  isOpen: boolean
  mode: ModalMode
  eventId?: string
  onClose: () => void
  onSave?: (data: EventFormValues) => void
}

export function EventDetailModal({ isOpen, mode, eventId, onClose, onSave }: EventDetailModalProps) {
  const isNew = mode === 'create'
  const isView = mode === 'view'

  const event = !isNew ? mockEvents.find((e) => e.id === eventId) : undefined

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
    })),
  )

  function handleSave(data: EventFormValues) {
    onSave?.(data)
    onClose()
  }

  function handleImport(itemsData: ItemInput[]) {
    itemsData.forEach((item) => addItem(item))
  }

  const aliadoName = mockAliados.find((a) => a.id === event?.aliadoId)?.nombre
  const municipioName = mockMunicipios.find((m) => m.id === event?.municipioId)?.nombre

  const title = isNew ? 'Nueva Orden' : isView ? `Orden ${event?.numeroEvento}` : `Editar ${event?.numeroEvento}`
  const subtitle = event && !isNew
    ? `${aliadoName ?? ''} · ${municipioName ?? ''} · ${event.items.length} ítems`
    : undefined

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} size="full">
      <div className="space-y-6">
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

        {!isView && (
          <>
            <EventForm
              event={event}
              aliados={mockAliados}
              desembolsos={mockDesembolsos}
              municipios={mockMunicipios}
              events={mockEvents}
              onSave={handleSave}
              onCancel={onClose}
            />

            <ItemManager
              items={items}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
              eventTotals={eventTotals}
              onOpenImport={() => setShowImport(true)}
            />
          </>
        )}

        {isView && (
          <ItemManager
            items={items}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            eventTotals={eventTotals}
            onOpenImport={() => setShowImport(true)}
          />
        )}
      </div>

      <ImportExcelModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </Modal>
  )
}
