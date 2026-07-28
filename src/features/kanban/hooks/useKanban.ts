import { useState, useCallback, useMemo } from 'react'
import type { Event, EventState } from '../../../types'
import type { KanbanGrouped, KanbanCardData, StateChangeRequest } from '../types'
import { KANBAN_COLUMNS } from '../types'

interface UseKanbanOptions {
  events: Event[]
}

export function useKanban({ events }: UseKanbanOptions) {
  const [pendingChange, setPendingChange] = useState<StateChangeRequest | null>(null)

  const [localEvents, setLocalEvents] = useState<Event[]>(events)

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

    setPendingChange({
      eventId: activeId,
      from: event.estado,
      to: targetState,
    })
  }

  const confirmStateChange = useCallback((reason?: string) => {
    void reason
    if (!pendingChange) return

    setLocalEvents((prev) =>
      prev.map((e) =>
        e.id === pendingChange.eventId
          ? { ...e, estado: pendingChange.to, updatedAt: new Date().toISOString() }
          : e,
      ),
    )
    setPendingChange(null)
  }, [pendingChange])

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
