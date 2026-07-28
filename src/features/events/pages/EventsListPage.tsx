import { useNavigate } from 'react-router-dom'
import { EventList } from '../components/EventList'
import { useEventList } from '../hooks/useEventList'
import { mockEvents, mockAliados, mockDesembolsos } from '../utils/mockData'

export function EventsListPage() {
  const navigate = useNavigate()
  const {
    filters,
    updateFilter,
    sort,
    toggleSort,
    setPage,
    meta,
    paginatedEvents,
  } = useEventList(mockEvents)

  return (
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
      onView={(id) => navigate(`/ordenes/${id}`)}
      onEdit={(id) => navigate(`/ordenes/${id}/editar`)}
      onCreate={() => navigate('/ordenes/nueva')}
    />
  )
}
