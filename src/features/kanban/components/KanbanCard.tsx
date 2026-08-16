import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Hash, User, Building2, DollarSign, Layers, CircleDot } from 'lucide-react'
import type { KanbanCardData } from '../types'
import { formatCurrencyCO } from '../../../utils/formatters'

export const CARD_HEIGHT = 160

const stateDotColors: Record<string, string> = {
  Abierto: 'bg-yellow-500',
  'En ejecución': 'bg-blue-500',
  Ejecutado: 'bg-orange-500',
  Cerrado: 'bg-slate-500',
  Legalizado: 'bg-purple-500',
  Devuelto: 'bg-amber-500',
  Cancelado: 'bg-rose-500',
}

interface KanbanCardProps {
  card: KanbanCardData
  aliadoNombre?: string
  municipioNombre?: string
  isOverlay?: boolean
}

export function KanbanCard({ card, aliadoNombre, municipioNombre, isOverlay }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: card,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined

  const dotColor = stateDotColors[card.estado] ?? 'bg-slate-400'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border p-4 space-y-2.5 transition-shadow ${
        isOverlay
          ? 'border-slate-300 shadow-xl ring-2 ring-primary'
          : isDragging
            ? 'opacity-40 shadow-lg ring-2 ring-primary border-primary/30'
            : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="p-1 rounded hover:bg-slate-100 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
            aria-label="Arrastrar tarjeta"
            title="Arrastrar para cambiar estado"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </button>
          <span className="font-medium text-sm text-slate-900 truncate">
            {card.numeroEvento}{card.sufijo ? `-${card.sufijo}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0" title={card.estado}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <CircleDot className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{aliadoNombre ?? card.aliadoId}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Hash className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{municipioNombre ?? card.municipioId}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{card.responsable}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Layers className="w-3.5 h-3.5" />
          {card.itemCount} ítem{card.itemCount !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-slate-900">
          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          {formatCurrencyCO(card.totalEconomico)}
        </div>
      </div>
    </div>
  )
}

export function KanbanCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3" style={{ height: CARD_HEIGHT }}>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 bg-slate-200 rounded flex-1 animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
      </div>
      <div className="flex justify-between pt-1">
        <div className="h-3 bg-slate-200 rounded w-16 animate-pulse" />
        <div className="h-3 bg-slate-200 rounded w-20 animate-pulse" />
      </div>
    </div>
  )
}
