import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EventList } from '../components/EventList'
import { ItemsModal } from '../components/ItemsModal'
import { QuotationsModal } from '../components/QuotationsModal'
import { SupportDocsModal } from '../components/SupportDocsModal'
import { useEventList } from '../hooks/useEventList'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEventsApi, getDeletedEventsApi, deleteEventApi, restoreEventApi } from '../../../services/events.service'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { Trash2, RotateCcw, Package, CheckCircle } from 'lucide-react'
import type { Event } from '../../../types'

export function EventsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const showDeleted = searchParams.get('anuladas') === '1'
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
  const [actionEvent, setActionEvent] = useState<Event | null>(null)
  const [actionType, setActionType] = useState<'items' | 'quotations' | 'supports' | 'approvals' | null>(null)
  const createdEventId = searchParams.get('created')

  const handleCloseCreatedModal = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('created')
      return next
    }, { replace: true })
  }, [setSearchParams])

  const handleEventAction = useCallback((event: Event, action: 'items' | 'quotations' | 'supports' | 'approvals') => {
    setActionEvent(event)
    setActionType(action)
  }, [])

  const handleCloseAction = useCallback(() => {
    setActionEvent(null)
    setActionType(null)
  }, [])

  const handleToggleDeleted = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (next.get('anuladas') === '1') {
          next.delete('anuladas')
        } else {
          next.set('anuladas', '1')
        }
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

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
        onToggleDeleted={handleToggleDeleted}
        onFilterChange={updateFilter}
        onSort={toggleSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onDeleteRequest={handleDeleteRequest}
        onRestoreRequest={handleRestoreRequest}
        onEventAction={handleEventAction}
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

      {actionEvent && actionType === 'items' && (
        <ItemsModal event={actionEvent} isOpen onClose={handleCloseAction} />
      )}
      {actionEvent && actionType === 'quotations' && (
        <QuotationsModal event={actionEvent} isOpen onClose={handleCloseAction} />
      )}
      {actionEvent && actionType === 'approvals' && (
        <QuotationsModal event={actionEvent} isOpen onClose={handleCloseAction} />
      )}
      {actionEvent && actionType === 'supports' && (
        <SupportDocsModal event={actionEvent} isOpen onClose={handleCloseAction} />
      )}

      {createdEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-[scaleIn_200ms_ease-out]">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-emerald-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Orden registrada satisfactoriamente</h3>
              <p className="text-sm text-slate-500 mt-2">
                ¿Desea agregarle ítems ahora? Puede hacerlo más tarde desde el icono{' '}
                <Package className="w-3.5 h-3.5 inline -mt-0.5" />{' '}
                <span className="font-medium">Gestionar ítems</span> en la columna de acciones del listado.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const event = localEvents.find((e) => e.id === createdEventId)
                  handleCloseCreatedModal()
                  if (event) {
                    setActionEvent(event)
                    setActionType('items')
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                <Package className="w-4 h-4" />
                Sí, Agregar ítems
              </button>
              <button
                onClick={handleCloseCreatedModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                No, agregar más tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
