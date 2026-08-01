import { useState, useMemo, useCallback } from 'react'
import { EventList } from '../components/EventList'
import { useEventList } from '../hooks/useEventList'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEventsApi, deleteEventApi } from '../../../services/events.service'
import { useToast } from '../../../components/ToastProvider'
import { Trash2 } from 'lucide-react'
import type { Event } from '../../../types'

export function EventsListPage() {
  const { data: localEvents = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: getEventsApi })

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
  const queryClient = useQueryClient()
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null)

  const handleDeleteRequest = useCallback((id: string) => {
    const event = localEvents.find((e) => e.id === id)
    if (event) setDeleteEvent(event)
  }, [localEvents])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteEvent) return
    await deleteEventApi(deleteEvent.id)
    queryClient.invalidateQueries({ queryKey: ['events'] })
    toast.showToast(`Orden ${deleteEvent.numeroEvento}${deleteEvent.sufijo ? `-${deleteEvent.sufijo}` : ''} eliminada correctamente`)
    setDeleteEvent(null)
  }, [deleteEvent, queryClient, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando eventos...</p>
      </div>
    )
  }

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
      />

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
