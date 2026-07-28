import { useState, useEffect } from 'react'
import { Modal } from '../../../layout/Modal'
import { EventForm } from './EventForm'
import { ItemManager } from './ItemManager'
import { ImportExcelModal } from './ImportExcelModal'
import { useItems } from '../hooks/useItems'
import { mockAliados, mockDesembolsos, mockMunicipios } from '../utils/mockData'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { EVENT_STATES, CURRENT_USER } from '../../../config/constants'
import { addAuditEntry } from '../../../lib/auditStore'
import { addStateHistoryEntry, getStateHistory } from '../../../lib/stateHistoryStore'
import type { EventFormValues } from '../schemas/eventSchema'
import type { ItemInput, Event as EventType, EventState } from '../../../types'

type ModalMode = 'create' | 'view' | 'edit'

interface EventDetailModalProps {
  isOpen: boolean
  mode: ModalMode
  eventId?: string
  events?: EventType[]
  onClose: () => void
  onSave?: (data: EventFormValues) => void
}

export function EventDetailModal({ isOpen, mode, eventId, events, onClose, onSave }: EventDetailModalProps) {
  const isNew = mode === 'create'
  const isView = mode === 'view'

  const sourceEvents = events ?? []
  const [event, setEvent] = useState<EventType | undefined>(
    () => (isNew ? undefined : sourceEvents.find((e) => e.id === eventId)),
  )

  useEffect(() => {
    if (!isNew) {
      setEvent(sourceEvents.find((e) => e.id === eventId))
    }
  }, [eventId, sourceEvents, isNew])

  const [showImport, setShowImport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

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

  function handleStateChange(newEstado: string) {
    if (!event) return
    const oldEstado = event.estado
    if (oldEstado === newEstado) return
    setEvent((prev) => prev ? { ...prev, estado: newEstado as EventState } : prev)
    addStateHistoryEntry({
      eventoId: event.id,
      estadoAnterior: oldEstado,
      estadoNuevo: newEstado as EventState,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      motivo: '',
    })
    addAuditEntry({
      accion: 'Cambio de estado',
      entidad: 'Event',
      entidadId: event.id,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Estado cambiado de ${oldEstado} a ${newEstado}`,
      valorAnterior: oldEstado,
      valorNuevo: newEstado,
    })
  }

  const stateHistory = event ? getStateHistory(event.id) : []

  function handleSave(data: EventFormValues) {
    onSave?.(data)
  }

  function handleImport(itemsData: ItemInput[]) {
    itemsData.forEach((item) => addItem(item))
  }

  const aliadoName = mockAliados.find((a) => a.id === event?.aliadoId)?.nombre
  const municipioName = mockMunicipios.find((m) => m.id === event?.municipioId)
  const desembolsoName = mockDesembolsos.find((d) => d.id === event?.desembolsoId)?.nombre

  const title = isNew ? 'Nueva Orden' : isView ? `Orden ${event?.numeroEvento}` : `Editar ${event?.numeroEvento}`
  const subtitle = event && !isNew
    ? `${aliadoName ?? ''} · ${municipioName?.nombre ?? ''} · ${event.items.length} ítems`
    : undefined

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} size="full">
      <div className="space-y-6">
        {isView && event && (
          <>
            <div className="bg-white rounded-lg border border-slate-200 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Responsable</p>
                <p className="text-sm font-medium text-slate-900">{event.responsable}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Dependencia</p>
                <p className="text-sm font-medium text-slate-900">{event.dependencia || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha Evento</p>
                <p className="text-sm font-medium text-slate-900">{event.fechaEvento ? formatDateCO(event.fechaEvento) : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Asistentes / Días</p>
                <p className="text-sm font-medium text-slate-900">{event.asistentes} asistentes · {event.dias} días</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Ubicación</p>
                <p className="text-sm font-medium text-slate-900">{municipioName?.nombre ?? event.municipioId} ({municipioName?.departamento ?? ''}){event.vereda ? ` · ${event.vereda}` : ''}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Coordenadas</p>
                <p className="text-sm font-medium text-slate-900">{event.latitud && event.longitud ? `${event.latitud}, ${event.longitud}` : 'No registradas'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Esquema</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{event.esquema}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Desembolso</p>
                <p className="text-sm font-medium text-slate-900">{desembolsoName ?? event.desembolsoId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Estado</p>
                <div className="flex items-center gap-2">
                  <select
                    value={event.estado}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="text-sm font-medium border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary"
                  >
                    {EVENT_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {stateHistory.length > 0 && (
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs text-primary hover:text-primary-dark underline shrink-0"
                    >
                      {showHistory ? 'Ocultar historial' : 'Ver historial'}
                    </button>
                  )}
                </div>
                {showHistory && stateHistory.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {stateHistory.map((h) => (
                      <p key={h.id} className="text-[11px] text-slate-500">
                        {formatDateCO(h.fecha)}: {h.estadoAnterior} → {h.estadoNuevo} ({h.usuario})
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrencyCO(eventTotals.granTotal)}</p>
              </div>
            </div>
            {event.observaciones && (
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observaciones</p>
                <p className="text-sm text-slate-700">{event.observaciones}</p>
              </div>
            )}
          </>
        )}

        {!isView && (
          <>
            <EventForm
              event={event}
              aliados={mockAliados}
              desembolsos={mockDesembolsos}
              municipios={mockMunicipios}
              events={sourceEvents}
              onSave={handleSave}
              onCancel={onClose}
            />

            <ItemManager
              items={items}
              aliados={mockAliados}
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
            aliados={mockAliados}
            eventTotals={eventTotals}
            readOnly
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
