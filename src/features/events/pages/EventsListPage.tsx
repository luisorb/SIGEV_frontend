import { useState, useMemo, useCallback } from 'react'
import { EventList } from '../components/EventList'
import { useEventList } from '../hooks/useEventList'
import { mockEvents } from '../utils/mockData'
import { addAuditEntry } from '../../../lib/auditStore'
import { CURRENT_USER } from '../../../config/constants'
import { useToast } from '../../../components/ToastProvider'
import type { Event } from '../../../types'

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

  function persistEvents(events: Event[]) {
    setLocalEvents(events)
    try {
      localStorage.setItem('sigev-events', JSON.stringify(events))
    } catch { /* silent */ }
  }

  const handleDelete = useCallback((id: string) => {
    const event = localEvents.find((e) => e.id === id)
    if (!event) return
    const updated = localEvents.map((e) =>
      e.id === id ? { ...e, activo: false, eliminadoAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : e,
    )
    persistEvents(updated)
    addAuditEntry({
      accion: 'Eliminación de evento',
      entidad: 'Event',
      entidadId: event.id,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Evento ${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''} eliminado (anulación lógica)`,
    })
    toast.showToast(`Orden ${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''} eliminada correctamente`)
  }, [localEvents])

  return (
    <EventList
      events={paginatedEvents}
      filters={filters}
      sort={sort}
      meta={meta}
      onFilterChange={updateFilter}
      onSort={toggleSort}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      onDelete={handleDelete}
    />
  )
}
