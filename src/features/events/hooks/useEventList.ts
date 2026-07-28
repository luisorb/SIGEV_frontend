import { useState, useMemo } from 'react'
import type { Event } from '../../../types'
import type { EventListFilters, EventListSort, EventListMeta } from '../types'

const ITEMS_PER_PAGE = 10

const SORTABLE_TEXT_COLUMNS = [
  'numeroEvento', 'responsable', 'estado', 'municipioId',
  'fechaEvento', 'esquema', 'aliadoId', 'desembolsoId',
] as const

const SORTABLE_NUMERIC_COLUMNS = ['itemsCount'] as const

export function useEventList(events: Event[]) {
  const [filters, setFilters] = useState<EventListFilters>({
    search: '',
    estado: '',
    aliadoId: '',
    desembolsoId: '',
    municipioId: '',
  })

  const [sort, setSort] = useState<EventListSort>({
    column: 'numeroEvento',
    direction: 'asc',
  })

  const [page, setPage] = useState(1)

  const filteredEvents = useMemo(() => {
    let result = [...events]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (e) =>
          e.numeroEvento.toLowerCase().includes(q) ||
          e.responsable.toLowerCase().includes(q) ||
          e.municipioId.toLowerCase().includes(q) ||
          e.aliadoId.toLowerCase().includes(q) ||
          e.desembolsoId.toLowerCase().includes(q),
      )
    }

    if (filters.estado) {
      result = result.filter((e) => e.estado === filters.estado)
    }

    if (filters.aliadoId) {
      result = result.filter((e) => e.aliadoId === filters.aliadoId)
    }

    if (filters.desembolsoId) {
      result = result.filter((e) => e.desembolsoId === filters.desembolsoId)
    }

    if (filters.municipioId) {
      result = result.filter((e) => e.municipioId === filters.municipioId)
    }

    const sortColumn = sort.column
    result.sort((a, b) => {
      let cmp = 0
      if (sortColumn === 'totalCalculado') {
        const totalA = a.items.reduce((s, i) => s + i.total, 0)
        const totalB = b.items.reduce((s, i) => s + i.total, 0)
        cmp = totalA - totalB
      } else if ((SORTABLE_NUMERIC_COLUMNS as readonly string[]).includes(sortColumn)) {
        const aVal = sortColumn === 'itemsCount' ? a.items.length : Number(a[sortColumn as keyof Event] ?? 0)
        const bVal = sortColumn === 'itemsCount' ? b.items.length : Number(b[sortColumn as keyof Event] ?? 0)
        cmp = aVal - bVal
      } else if ((SORTABLE_TEXT_COLUMNS as readonly string[]).includes(sortColumn)) {
        const aVal = String(a[sortColumn as keyof Event] ?? '')
        const bVal = String(b[sortColumn as keyof Event] ?? '')
        cmp = aVal.localeCompare(bVal)
      }
      return sort.direction === 'asc' ? cmp : -cmp
    })

    return result
  }, [events, filters, sort])

  const meta: EventListMeta = {
    total: events.length,
    filtered: filteredEvents.length,
    page,
    pageSize: ITEMS_PER_PAGE,
    totalPages: Math.max(1, Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)),
  }

  const paginatedEvents = filteredEvents.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  )

  function updateFilter(key: keyof EventListFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function toggleSort(column: string) {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  return {
    filters,
    updateFilter,
    sort,
    toggleSort,
    page,
    setPage,
    meta,
    paginatedEvents,
  }
}
