import { useState, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Event, EventState } from '../../../types'
import type { KanbanGrouped, KanbanCardData, StateChangeRequest } from '../types'
import { KANBAN_COLUMNS } from '../types'
import { useStateMachine } from '../../events/hooks/useStateMachine'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { changeEventStatusApi } from '../../../services/events.service'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'

interface UseKanbanOptions {
  events: Event[]
}

export function useKanban({ events }: UseKanbanOptions) {
  const [pendingChange, setPendingChange] = useState<StateChangeRequest | null>(null)
  const queryClient = useQueryClient()
  const { canTransition } = useStateMachine()
  const { roleNames } = useRolePermissions()
  const toast = useToast()

  const grouped = useMemo<KanbanGrouped>(() => {
    const groups: KanbanGrouped = {}
    for (const col of KANBAN_COLUMNS) {
      groups[col] = []
    }
    for (const event of events) {
      const card: KanbanCardData = {
        id: event.id,
        numeroEvento: event.numeroEvento,
        sufijo: event.sufijo,
        responsable: event.responsable,
        municipioId: event.municipioId,
        aliadoId: event.aliadoId,
        desembolsoId: event.desembolsoId,
        estado: event.estado,
        itemCount: event.ofertaEconomica?.items?.length ?? event.items.length,
        totalEconomico: event.ofertaEconomica?.total ?? 0,
      }
      groups[event.estado]?.push(card)
    }
    return groups
  }, [events])

  const counts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const col of KANBAN_COLUMNS) {
      result[col] = grouped[col]?.length ?? 0
    }
    return result
  }, [grouped])

  function handleDragEnd(activeId: string, overId?: string) {
    if (!overId || activeId === overId) return

    const event = events.find((e) => e.id === activeId)
    if (!event) return

    const targetState = overId as EventState
    if (!KANBAN_COLUMNS.includes(targetState)) return

    if (event.estado === targetState) return

    if (!canTransition(event, targetState, roleNames)) {
      toast.showToast(
        event.estado === 'Devuelto'
          ? `Para salir de "Devuelto" el evento debe regresar al estado del que provenía (${event.devueltoDesde ?? 'origen desconocido'})`
          : `Su rol no permite mover el evento de "${event.estado}" a "${targetState}"`,
        'error',
      )
      return
    }

    const hasDefinitiveQuotation =
      event.quotations?.some((q) => q.isDefinitive) === true ||
      !!event.cotizacionSeleccionadaId
    const isDevolucionInicial = event.estado === 'Abierto' && targetState === 'Devuelto'
    const retornoDevueltoAbierto = event.estado === 'Devuelto' && targetState === 'Abierto'

    if (targetState !== 'Cancelado') {
      if (isDevolucionInicial) {
        if ((event.quotations?.length ?? 0) < 1) {
          toast.showToast('La orden debe contar con al menos una cotización para devolverla a ajustes', 'error')
          return
        }
      } else if (retornoDevueltoAbierto) {
        // Regla de oro: retorno de la devolución al estado Abierto, no exige cotización definitiva
      } else if (!hasDefinitiveQuotation) {
        toast.showToast('La orden debe contar con al menos una cotización aprobada de forma definitiva antes de cambiar su estado', 'error')
        return
      }
    }

    if (event.estado === 'En ejecución' && targetState === 'Ejecutado') {
      const requiredFolders = ['Facturas normalizadas', 'Registro fotográfico', 'Listado de asistencia']
      const loadedFolders = new Set(
        (event.attachments ?? [])
          .map((a) => a.category)
          .filter((c): c is string => !!c),
      )
      const missing = requiredFolders.filter((folder) => !loadedFolders.has(folder))
      if (missing.length > 0) {
        toast.showToast(
          `Para pasar la orden a "Ejecutado" cada carpeta de soportes debe tener al menos un documento. Faltan documentos en: ${missing.join(', ')}.`,
          'error',
        )
        return
      }
    }

    setPendingChange({
      eventId: activeId,
      from: event.estado,
      to: targetState,
    })
  }

  const confirmStateChange = useCallback(async (reason?: string) => {
    if (!pendingChange) return

    const { eventId, from, to } = pendingChange
    try {
      await changeEventStatusApi(eventId, to, { observation: reason || undefined })
      queryClient.setQueryData<Event[]>(['events'], (prev) =>
        prev?.map((e) =>
          e.id === eventId
            ? {
                ...e,
                estado: to,
                devueltoDesde: to === 'Devuelto' ? from : null,
                updatedAt: new Date().toISOString(),
              }
            : e,
        ),
      )
      toast.showToast(`Evento movido a "${to}"`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo cambiar el estado del evento'), 'error')
    }
    setPendingChange(null)
  }, [pendingChange, toast, queryClient])

  const cancelStateChange = useCallback(() => {
    setPendingChange(null)
  }, [])

  return {
    grouped,
    counts,
    pendingChange,
    handleDragEnd,
    confirmStateChange,
    cancelStateChange,
  }
}
