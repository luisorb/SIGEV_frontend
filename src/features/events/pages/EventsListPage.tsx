import { useState } from 'react'
import { EventList } from '../components/EventList'
import { EventDetailModal } from '../components/EventDetailModal'
import { useEventList } from '../hooks/useEventList'
import { mockEvents, mockAliados, mockDesembolsos } from '../utils/mockData'

type ModalMode = 'create' | 'view' | 'edit'

export function EventsListPage() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  const {
    filters,
    updateFilter,
    sort,
    toggleSort,
    setPage,
    meta,
    paginatedEvents,
  } = useEventList(mockEvents)

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

  return (
    <>
      <EventList
        events={paginatedEvents}
        aliados={mockAliados}
        desembolsos={mockDesembolsos}
        filters={filters}
        sort={sort}
        meta={meta}
        onFilterChange={updateFilter}
        onSort={toggleSort}
        onPageChange={setPage}
        onView={openView}
        onEdit={openEdit}
        onCreate={openCreate}
      />

      {modalMode && (
        <EventDetailModal
          isOpen
          mode={modalMode}
          eventId={selectedId}
          onClose={closeModal}
        />
      )}
    </>
  )
}
