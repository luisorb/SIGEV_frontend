import { useState, useMemo, useCallback } from 'react'
import { EventList } from '../components/EventList'
import { useEventList } from '../hooks/useEventList'
import { mockEvents } from '../utils/mockData'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { useToast } from '../../../components/ToastProvider'
import { Trash2, UserCog } from 'lucide-react'
import type { Event } from '../../../types'

const OPERATORS = [
  'Operador Logístico 1',
  'Operador Logístico 2',
  'Operador Logístico 3',
  'Operador Logístico 4',
]

interface AssignOperatorModalProps {
  event: Event
  operators: string[]
  onConfirm: (id: string, operatorName: string) => void
  onClose: () => void
}

function AssignOperatorModal({ event, operators, onConfirm, onClose }: AssignOperatorModalProps) {
  const [selected, setSelected] = useState(event.asignadoA || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <UserCog className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Asignar Operador Logístico</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Orden {event.numeroEvento}{event.sufijo ? `-${event.sufijo}` : ''}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Operador logístico
          </label>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Seleccione un operador...</option>
            {operators.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (selected) onConfirm(event.id, selected) }}
            disabled={!selected}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCog className="w-4 h-4" />
            Asignar
          </button>
        </div>
      </div>
    </div>
  )
}

export function EventsListPage() {
  const [localEvents, setLocalEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('sigev-events')
      if (saved) {
        const parsed = JSON.parse(saved) as Event[]
        if (parsed.length >= mockEvents.length) return parsed
      }
      localStorage.setItem('sigev-events', JSON.stringify(mockEvents))
      return mockEvents
    } catch {
      return mockEvents
    }
  })

  const activeEvents = useMemo(() => localEvents.filter((e) => e.activo !== false), [localEvents])

  const {
    filters,
    updateFilter,
    sort,
    toggleSort,
    setPage,
    setPageSize,
    meta,
    paginatedEvents,
  } = useEventList(activeEvents)

  const toast = useToast()
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null)
  const [assignOperatorEvent, setAssignOperatorEvent] = useState<Event | null>(null)

  function persistEvents(events: Event[]) {
    setLocalEvents(events)
    try {
      localStorage.setItem('sigev-events', JSON.stringify(events))
    } catch { /* silent */ }
  }

  const handleAssignOperator = useCallback((id: string, operatorName: string) => {
    const updated = localEvents.map((e) =>
      e.id === id ? { ...e, asignadoA: operatorName, updatedAt: new Date().toISOString() } : e,
    )
    persistEvents(updated)
    addAuditEntry({
      accion: 'Asignación de operador logístico',
      entidad: 'Event',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Operador "${operatorName}" asignado al evento`,
    })
    toast.showToast(`Operador ${operatorName} asignado`)
    setAssignOperatorEvent(null)
  }, [localEvents])

  const handleDeleteRequest = useCallback((id: string) => {
    const event = localEvents.find((e) => e.id === id)
    if (event) setDeleteEvent(event)
  }, [localEvents])

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteEvent) return
    const updated = localEvents.map((e) =>
      e.id === deleteEvent.id
        ? { ...e, activo: false, eliminadoAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        : e,
    )
    persistEvents(updated)
    addAuditEntry({
      accion: 'Eliminación de evento',
      entidad: 'Event',
      entidadId: deleteEvent.id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Evento ${deleteEvent.numeroEvento}${deleteEvent.sufijo ? `-${deleteEvent.sufijo}` : ''} eliminado (anulación lógica)`,
    })
    toast.showToast(`Orden ${deleteEvent.numeroEvento}${deleteEvent.sufijo ? `-${deleteEvent.sufijo}` : ''} eliminada correctamente`)
    setDeleteEvent(null)
  }, [deleteEvent, localEvents])

  return (
    <>
      <EventList
        events={paginatedEvents}
        filters={filters}
        sort={sort}
        meta={meta}
        onFilterChange={updateFilter}
        onSort={toggleSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onDeleteRequest={handleDeleteRequest}
        onAssignOperatorClick={(id) => {
          const event = localEvents.find((e) => e.id === id)
          if (event) setAssignOperatorEvent(event)
        }}
      />

      {assignOperatorEvent && (
        <AssignOperatorModal
          event={assignOperatorEvent}
          operators={OPERATORS}
          onConfirm={handleAssignOperator}
          onClose={() => setAssignOperatorEvent(null)}
        />
      )}

      {deleteEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Eliminar orden</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de eliminar{' '}
              <span className="font-semibold">{deleteEvent.numeroEvento}{deleteEvent.sufijo ? `-${deleteEvent.sufijo}` : ''}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteEvent(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
