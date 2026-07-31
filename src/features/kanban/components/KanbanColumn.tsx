import { useDroppable } from '@dnd-kit/core'
import { ChevronRight } from 'lucide-react'
import type { KanbanCardData } from '../types'
import { KanbanCard, KanbanCardSkeleton } from './KanbanCard'

const columnStyles: Record<string, { header: string; dot: string; bg: string }> = {
  Postulado: { header: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', bg: 'bg-yellow-50/50' },
  'En preparación': { header: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', bg: 'bg-blue-50/50' },
  'En revisión': { header: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', bg: 'bg-orange-50/50' },
  'En ejecución': { header: 'bg-red-50 border-red-200', dot: 'bg-primary', bg: 'bg-red-50/50' },
  Cerrado: { header: 'bg-slate-50 border-slate-200', dot: 'bg-slate-500', bg: 'bg-slate-50/50' },
  Legalizado: { header: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500', bg: 'bg-purple-50/50' },
  Devuelto: { header: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', bg: 'bg-amber-50/50' },
  Rechazado: { header: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', bg: 'bg-rose-50/50' },
}

interface KanbanColumnProps {
  estado: string
  cards: KanbanCardData[]
  count: number
  aliadosMap: Record<string, string>
  municipiosMap: Record<string, string>
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
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: estado })

  const styles = columnStyles[estado] ?? columnStyles.Postulado
  const totalValor = cards.reduce((s, c) => s + c.totalEconomico, 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border min-w-[280px] w-[280px] flex-shrink-0 ${
        isOver ? 'ring-2 ring-primary border-red-300' : 'border-slate-200'
      } ${styles.bg}`}
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
          <div className="flex flex-col items-center justify-center h-32 text-xs text-slate-400 text-center">
            <ChevronRight className="w-5 h-5 mb-1 text-slate-300" />
            <span>Arrastra eventos aquí</span>
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
  const styles = columnStyles[estado] ?? columnStyles.Postulado
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
