import { useState, useCallback, useMemo } from 'react'
import { EventList } from '../components/EventList'
import { EventDetailModal } from '../components/EventDetailModal'
import { useEventList } from '../hooks/useEventList'
import { mockEvents, mockAliados, mockDesembolsos, mockMunicipios } from '../utils/mockData'
import { addAuditEntry } from '../../../lib/auditStore'
import { CURRENT_USER } from '../../../config/constants'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Event } from '../../../types'

type ModalMode = 'create' | 'view' | 'edit'

export function EventsListPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [localEvents, setLocalEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('sigev-events')
      return saved ? JSON.parse(saved) : mockEvents
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
    meta,
    paginatedEvents,
  } = useEventList(activeEvents)

  function persistEvents(events: Event[]) {
    setLocalEvents(events)
    try {
      localStorage.setItem('sigev-events', JSON.stringify(events))
    } catch { /* quota exceeded, silent fail */ }
  }

  function openCreate() {
    setSelectedId(undefined)
    setModalMode('create')
  }

  function openView(id: string) {
    setSelectedId(id)
    setModalMode('view')
  }

  function openEdit(id: string) {
    setSelectedId(id)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedId(undefined)
  }

  const handleSave = useCallback((data: EventFormValues) => {
    if (selectedId) {
      const updated = localEvents.map((e) =>
        e.id === selectedId
          ? { ...e, ...data, updatedAt: new Date().toISOString() }
          : e,
      )
      persistEvents(updated)
    } else {
      const newId = `EVT-${String(localEvents.length + 1).padStart(3, '0')}`
      const newEvent: Event = {
        id: newId,
        numeroEvento: data.numeroEvento,
        sufijo: data.sufijo ?? '',
        responsable: data.responsable,
        dependencia: data.dependencia ?? '',
        municipioId: data.municipioId,
        aliadoId: data.aliadoId,
        desembolsoId: data.desembolsoId,
        esquema: data.esquema,
        estado: data.estado ?? 'Abierto',
        fechaEvento: data.fechaEvento ?? '',
        asistentes: data.asistentes ?? 0,
        dias: data.dias ?? 0,
        vereda: data.vereda ?? '',
        latitud: data.latitud ?? undefined,
        longitud: data.longitud ?? undefined,
        observaciones: data.observaciones ?? '',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Event
      persistEvents([newEvent, ...localEvents])
    }
    closeModal()
  }, [selectedId, localEvents])

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
  }, [localEvents])

  return (
    <>
      <EventList
        events={paginatedEvents}
        aliados={mockAliados}
        desembolsos={mockDesembolsos}
        municipios={mockMunicipios}
        filters={filters}
        sort={sort}
        meta={meta}
        onFilterChange={updateFilter}
        onSort={toggleSort}
        onPageChange={setPage}
        onView={openView}
        onEdit={openEdit}
        onDelete={handleDelete}
        onCreate={openCreate}
      />

      {modalMode && (
        <EventDetailModal
          key={selectedId ?? 'create'}
          isOpen
          mode={modalMode}
          eventId={selectedId}
          events={activeEvents}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </>
  )
}
