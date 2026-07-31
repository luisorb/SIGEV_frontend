import { useState, useCallback, useMemo } from 'react'
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
  const [localEvents, setLocalEvents] = useState<Event[]>(events)
  const { canTransition } = useStateMachine()
  const { roleNames } = useRolePermissions()
  const toast = useToast()

  const grouped = useMemo<KanbanGrouped>(() => {
    const groups: KanbanGrouped = {}
    for (const col of KANBAN_COLUMNS) {
      groups[col] = []
    }
    for (const event of localEvents) {
      const card: KanbanCardData = {
        id: event.id,
        numeroEvento: event.numeroEvento,
        sufijo: event.sufijo,
        responsable: event.responsable,
        municipioId: event.municipioId,
        aliadoId: event.aliadoId,
        desembolsoId: event.desembolsoId,
        estado: event.estado,
        itemCount: event.items.length,
        totalEconomico: event.items.reduce((s, i) => s + i.total, 0),
      }
      groups[event.estado]?.push(card)
    }
    return groups
  }, [localEvents])

  const counts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const col of KANBAN_COLUMNS) {
      result[col] = grouped[col]?.length ?? 0
    }
    return result
  }, [grouped])

  function handleDragEnd(activeId: string, overId?: string) {
    if (!overId || activeId === overId) return

    const event = localEvents.find((e) => e.id === activeId)
    if (!event) return

    const targetState = overId as EventState
    if (!KANBAN_COLUMNS.includes(targetState)) return

    if (event.estado === targetState) return

    if (!canTransition(event.estado, targetState, roleNames)) {
      toast.showToast(`Su rol no permite mover el evento de "${event.estado}" a "${targetState}"`, 'error')
      return
    }

    setPendingChange({
      eventId: activeId,
      from: event.estado,
      to: targetState,
    })
  }

  const confirmStateChange = useCallback(async (reason?: string) => {
    if (!pendingChange) return

    const { eventId, to } = pendingChange
    try {
      await changeEventStatusApi(eventId, to, { observation: reason || undefined })
      setLocalEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, estado: to, updatedAt: new Date().toISOString() }
            : e,
        ),
      )
      toast.showToast(`Evento movido a "${to}"`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo cambiar el estado del evento'), 'error')
    }
    setPendingChange(null)
  }, [pendingChange, toast])

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
