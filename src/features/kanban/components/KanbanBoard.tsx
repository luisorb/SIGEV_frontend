import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { StateChangeModal } from './StateChangeModal'
import { KANBAN_COLUMNS } from '../types'
import type { KanbanGrouped, KanbanCardData, StateChangeRequest } from '../types'

interface KanbanBoardProps {
  grouped: KanbanGrouped
  counts: Record<string, number>
  aliadosMap: Record<string, string>
  municipiosMap: Record<string, string>
  onDragEnd: (activeId: string, overId?: string) => void
  pendingChange: StateChangeRequest | null
  onConfirmChange: (reason?: string) => void
  onCancelChange: () => void
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
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveCard(event.active.data.current as KanbanCardData)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null)
    const { active, over } = event
    onDragEnd(String(active.id), over ? String(over.id) : undefined)
  }

  function handleDragCancel() {
    setActiveCard(null)
  }

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
