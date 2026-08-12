import { useState, useMemo, useCallback } from 'react'
import { EventList } from '../components/EventList'
import { useEventList } from '../hooks/useEventList'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEventsApi, getDeletedEventsApi, deleteEventApi, restoreEventApi } from '../../../services/events.service'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { Trash2, RotateCcw } from 'lucide-react'
import type { Event } from '../../../types'

export function EventsListPage() {
  const [showDeleted, setShowDeleted] = useState(false)
  const { data: localEvents = [], isLoading } = useQuery({
    queryKey: ['events', showDeleted],
    queryFn: showDeleted ? getDeletedEventsApi : getEventsApi,
  })

  const activeEvents = useMemo(
    () =>
      showDeleted
        ? localEvents.filter((e) => e.eliminadoAt)
        : localEvents.filter((e) => e.activo !== false),
    [localEvents, showDeleted],
  )

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
  const [restoreEvent, setRestoreEvent] = useState<Event | null>(null)

  const handleDeleteRequest = useCallback((id: string) => {
    const event = localEvents.find((e) => e.id === id)
    if (event) setDeleteEvent(event)
  }, [localEvents])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteEvent) return
    try {
      await deleteEventApi(deleteEvent.id)
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.showToast(`Orden ${deleteEvent.numeroEvento}${deleteEvent.sufijo ? `-${deleteEvent.sufijo}` : ''} anulada correctamente`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo anular la orden'), 'error')
    }
    setDeleteEvent(null)
  }, [deleteEvent, queryClient, toast])

  const handleRestoreRequest = useCallback((id: string) => {
    const event = localEvents.find((e) => e.id === id)
    if (event) setRestoreEvent(event)
  }, [localEvents])

  const handleRestoreConfirm = useCallback(async () => {
    if (!restoreEvent) return
    try {
      await restoreEventApi(restoreEvent.id)
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      toast.showToast(`Orden ${restoreEvent.numeroEvento}${restoreEvent.sufijo ? `-${restoreEvent.sufijo}` : ''} restaurada correctamente`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo restaurar la orden'), 'error')
    }
    setRestoreEvent(null)
  }, [restoreEvent, queryClient, toast])

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
        showDeleted={showDeleted}
        onToggleDeleted={() => setShowDeleted((v) => !v)}
        onFilterChange={updateFilter}
        onSort={toggleSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onDeleteRequest={handleDeleteRequest}
        onRestoreRequest={handleRestoreRequest}
      />

      {deleteEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Anular orden</h3>
                <p className="text-xs sm:text-sm text-slate-500">La orden quedará anulada y oculta del sistema.</p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de anular{' '}
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
                Anular
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Restaurar orden</h3>
                <p className="text-xs sm:text-sm text-slate-500">La orden volverá a aparecer en el sistema con su estado actual.</p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de restaurar{' '}
              <span className="font-semibold">{restoreEvent.numeroEvento}{restoreEvent.sufijo ? `-${restoreEvent.sufijo}` : ''}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRestoreEvent(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestoreConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all duration-150"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
