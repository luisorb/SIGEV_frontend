import { Pencil, Trash2 } from 'lucide-react'
import type { ManagedItem } from '../hooks/useItems'
import type { Ally } from '../../../types'
import { formatCurrencyCO } from '../../../utils/formatters'

interface ItemRowProps {
  item: ManagedItem
  aliados?: Ally[]
  onEdit?: (item: ManagedItem) => void
  onRemove?: (id: string) => void
  readOnly?: boolean
  index?: number
}

const categoryBadges: Record<string, string> = {
  IVA: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Consumo: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Tercero: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  Reembolso: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
}

export function ItemRow({ item, aliados, onEdit, onRemove, readOnly = false, index = 0 }: ItemRowProps) {
  return (
    <tr className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/20`}>
      <td className="px-5 py-3">
        <span className="text-sm font-medium text-slate-900">{item.descripcion}</span>
      </td>
      <td className="px-5 py-3">
        <span className="text-sm text-slate-900 block text-right tabular-nums">{item.cantidad}</span>
      </td>
      <td className="px-5 py-3">
        <span className="text-sm text-slate-900 block text-right tabular-nums">{formatCurrencyCO(item.valorUnitario)}</span>
      </td>
      <td className="px-5 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md ${categoryBadges[item.categoriaTributaria] || 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}>
          {item.categoriaTributaria}
        </span>
      </td>
      <td className="px-5 py-3">
        <span className="text-sm text-slate-600">
          {item.aliadoId ? aliados?.find((a) => a.id === item.aliadoId)?.nombre ?? item.aliadoId : (
            <span className="text-slate-400 italic">Del evento</span>
          )}
        </span>
      </td>
      <td className="px-5 py-3 text-sm text-right font-medium text-slate-900 tabular-nums border-l border-slate-100/80 bg-slate-50/30">
        {formatCurrencyCO(item.totals.base)}
      </td>
      <td className="px-5 py-3 text-sm text-right text-slate-600 tabular-nums bg-slate-50/30">
        {formatCurrencyCO(item.totals.impuestos)}
      </td>
      <td className="px-5 py-3 text-sm text-right text-slate-600 tabular-nums bg-slate-50/30">
        {formatCurrencyCO(item.totals.feeTotal)}
      </td>
      <td className="px-5 py-3 text-sm text-right font-semibold text-slate-900 tabular-nums bg-slate-50/30">
        {formatCurrencyCO(item.totals.total)}
      </td>
      {!readOnly && (
        <td className="px-5 py-3 text-right">
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
        </td>
      )}
    </tr>
  )
}
