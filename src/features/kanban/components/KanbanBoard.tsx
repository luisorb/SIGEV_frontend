import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { StateChangeModal } from './StateChangeModal'
import { KANBAN_COLUMNS } from '../types'
import type { KanbanGrouped, KanbanCardData, StateChangeRequest } from '../types'
import type { EventState } from '../../../types'

interface KanbanBoardProps {
  grouped: KanbanGrouped
  counts: Record<string, number>
  aliadosMap: Record<string, string>
  municipiosMap: Record<string, string>
  onDragEnd: (activeId: string, overId?: string) => void
  pendingChange: StateChangeRequest | null
  onConfirmChange: (reason?: string) => void
  onCancelChange: () => void
  getValidTransitions: (eventId: string) => EventState[]
}

export function KanbanBoard({
  grouped,
  counts,
  aliadosMap,
  municipiosMap,
  onDragEnd,
  pendingChange,
  onConfirmChange,
  onCancelChange,
  getValidTransitions,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)
  const [validTargets, setValidTargets] = useState<EventState[] | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    const card = event.active.data.current as KanbanCardData
    setActiveCard(card)
    setValidTargets(getValidTransitions(card.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    setValidTargets(null)
    const { active, over } = event
    onDragEnd(String(active.id), over ? String(over.id) : undefined)
  }

  function handleDragCancel() {
    setActiveCard(null)
    setValidTargets(null)
  }

  const isDragging = activeCard !== null

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {KANBAN_COLUMNS.map((estado) => (
            <KanbanColumn
              key={estado}
              estado={estado}
              cards={grouped[estado] ?? []}
              count={counts[estado] ?? 0}
              aliadosMap={aliadosMap}
              municipiosMap={municipiosMap}
              isValidTarget={validTargets === null ? null : validTargets.includes(estado)}
              isDragging={isDragging}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="rotate-3 opacity-90">
              <KanbanCard
                card={activeCard}
                aliadoNombre={aliadosMap[activeCard.aliadoId]}
                municipioNombre={municipiosMap[activeCard.municipioId]}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {pendingChange && (
        <StateChangeModal
          pendingChange={pendingChange}
          onConfirm={onConfirmChange}
          onCancel={onCancelChange}
        />
      )}
    </>
  )
}
