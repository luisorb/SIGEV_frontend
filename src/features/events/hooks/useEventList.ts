import { useState, useMemo } from 'react'
import type { Event } from '../../../types'
import type { EventListFilters, EventListSort, EventListMeta } from '../types'

export type PageSize = 10 | 20 | 30 | 50 | 100

const SORTABLE_TEXT_COLUMNS = [
  'numeroEvento', 'responsable', 'estado', 'municipioId',
  'fechaEvento', 'esquema', 'aliadoId', 'desembolsoId',
] as const

export function useEventList(events: Event[]) {
  const [filters, setFilters] = useState<EventListFilters>({
    search: '',
    estado: '',
    aliadoId: '',
    desembolsoId: '',
    municipioId: '',
  })

  const [sort, setSort] = useState<EventListSort>({
    column: '',
    direction: null,
  })

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)

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

    if (sort.direction) {
      const sortColumn = sort.column
      result.sort((a, b) => {
        let cmp = 0
        if (sortColumn === 'totalCalculado') {
          const totalA = a.ofertaEconomica ? a.ofertaEconomica.total : 0
          const totalB = b.ofertaEconomica ? b.ofertaEconomica.total : 0
          cmp = totalA - totalB
        } else if ((SORTABLE_TEXT_COLUMNS as readonly string[]).includes(sortColumn)) {
          const aVal = String(a[sortColumn as keyof Event] ?? '')
          const bVal = String(b[sortColumn as keyof Event] ?? '')
          cmp = aVal.localeCompare(bVal)
        }
        return sort.direction === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [events, filters, sort])

  const meta: EventListMeta = {
    total: events.length,
    filtered: filteredEvents.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filteredEvents.length / pageSize)),
  }

  const paginatedEvents = filteredEvents.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  function updateFilter(key: keyof EventListFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function toggleSort(column: string) {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      return { column: '', direction: null }
    })
  }

  return {
    filters,
    updateFilter,
    sort,
    toggleSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    meta,
    paginatedEvents,
  }
}
