import { Pencil, Trash2, Lock } from 'lucide-react'
import type { ManagedItem } from '../hooks/useItems'
import type { Ally } from '../../../types'

interface ItemRowProps {
  item: ManagedItem
  aliados?: Ally[]
  onEdit?: (item: ManagedItem) => void
  onRemove?: (id: string) => void
  readOnly?: boolean
  lockReason?: string
  index?: number
}

export function ItemRow({ item, onEdit, onRemove, readOnly = false, lockReason, index = 0 }: ItemRowProps) {
  const isLocked = readOnly || !!lockReason || item.isTariffed
  return (
    <tr className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/20 ${isLocked ? 'opacity-80' : ''}`}>
      <td className="px-5 py-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-900">{item.nombre}</span>
          {item.descripcion && (
            <span className="text-xs text-slate-500 mt-0.5">{item.descripcion}</span>
          )}
          {item.isTariffed && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-700 rounded ring-1 ring-green-200 w-fit mt-1">
              <Lock className="w-2.5 h-2.5" />
              Tarifado
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md ${item.isTariffed ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {item.isTariffed ? 'Tarifado' : 'Manual'}
        </span>
      </td>
      <td className="px-5 py-3">
        <span className="text-sm text-slate-600">{item.unidadMedida ?? '-'}</span>
      </td>
      <td className="px-5 py-3">
        <span className="text-sm text-slate-900 block text-right tabular-nums">{item.cantidad}</span>
      </td>
      {!readOnly && (
        <td className="px-5 py-3 text-right">
          {lockReason ? (
            <span className="inline-flex items-center gap-1 text-slate-300" title={lockReason}>
              <Lock className="w-4 h-4" />
            </span>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => onEdit?.(item)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                title="Editar ítem"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemove?.(item.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                title="Eliminar ítem"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  )
}
