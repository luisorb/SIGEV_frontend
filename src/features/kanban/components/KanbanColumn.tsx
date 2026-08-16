import { useDroppable } from '@dnd-kit/core'
import { ChevronRight, MousePointerClick } from 'lucide-react'
import type { KanbanCardData } from '../types'
import { KanbanCard, KanbanCardSkeleton } from './KanbanCard'

const columnStyles: Record<string, { header: string; dot: string; bg: string; validBg: string }> = {
  Abierto: { header: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', bg: 'bg-yellow-50/50', validBg: 'bg-yellow-100/70 ring-2 ring-yellow-400/60' },
  'En ejecución': { header: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', bg: 'bg-blue-50/50', validBg: 'bg-blue-100/70 ring-2 ring-blue-400/60' },
  Ejecutado: { header: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', bg: 'bg-orange-50/50', validBg: 'bg-orange-100/70 ring-2 ring-orange-400/60' },
  Cerrado: { header: 'bg-slate-50 border-slate-200', dot: 'bg-slate-500', bg: 'bg-slate-50/50', validBg: 'bg-slate-100/70 ring-2 ring-slate-400/60' },
  Legalizado: { header: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500', bg: 'bg-purple-50/50', validBg: 'bg-purple-100/70 ring-2 ring-purple-400/60' },
  Devuelto: { header: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', bg: 'bg-amber-50/50', validBg: 'bg-amber-100/70 ring-2 ring-amber-400/60' },
  Cancelado: { header: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', bg: 'bg-rose-50/50', validBg: 'bg-rose-100/70 ring-2 ring-rose-400/60' },
}

interface KanbanColumnProps {
  estado: string
  cards: KanbanCardData[]
  count: number
  aliadosMap: Record<string, string>
  municipiosMap: Record<string, string>
  isValidTarget: boolean | null
  isDragging: boolean
}

function formatCompactCO(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function KanbanColumn({
  estado,
  cards,
  count,
  aliadosMap,
  municipiosMap,
  isValidTarget,
  isDragging,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado })

  const styles = columnStyles[estado] ?? columnStyles.Abierto
  const totalValor = cards.reduce((s, c) => s + c.totalEconomico, 0)

  const showValidHighlight = isDragging && isValidTarget === true
  const showInvalidDim = isDragging && isValidTarget === false

  let borderClass = 'border-slate-200'
  if (isOver) {
    borderClass = 'border-primary ring-2 ring-primary'
  } else if (showValidHighlight) {
    borderClass = `border-transparent ${styles.validBg}`
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border min-w-[280px] w-[280px] flex-shrink-0 transition-all duration-200 ${
        showInvalidDim ? 'opacity-40 grayscale' : ''
      } ${borderClass} ${styles.bg}`}
    >
      <div className={`flex items-center gap-2 px-4 py-3 border-b rounded-t-lg ${styles.header}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
        <div className="min-w-0">
          <span className="text-sm font-semibold text-slate-800">{estado}</span>
          <p className="text-[11px] text-slate-500 leading-tight">{formatCompactCO(totalValor)}</p>
        </div>
        <span className="ml-auto text-xs font-medium text-slate-500 bg-white/80 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
        {cards.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-32 text-xs text-center rounded-lg border-2 border-dashed transition-colors duration-200 ${
            showValidHighlight
              ? 'text-primary border-primary/40 bg-primary/5'
              : 'text-slate-400 border-slate-200'
          }`}>
            {showValidHighlight ? (
              <>
                <MousePointerClick className="w-6 h-6 mb-1.5 text-primary/60" />
                <span className="font-medium">Suelta aquí</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-5 h-5 mb-1 text-slate-300" />
                <span>Arrastra eventos aquí</span>
              </>
            )}
          </div>
        ) : (
          cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              aliadoNombre={aliadosMap[card.aliadoId]}
              municipioNombre={municipiosMap[card.municipioId]}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function KanbanColumnSkeleton({ estado }: { estado: string }) {
  const styles = columnStyles[estado] ?? columnStyles.Abierto
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 min-w-[280px] w-[280px] flex-shrink-0 bg-slate-50/50">
      <div className={`flex items-center gap-2 px-4 py-3 border-b rounded-t-lg ${styles.header}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
        <span className="text-sm font-semibold text-slate-800">{estado}</span>
      </div>
      <div className="p-3 space-y-3">
        {[1, 2].map((i) => (
          <KanbanCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
