import { Trash2 } from 'lucide-react'
import type { ManagedItem } from '../hooks/useItems'
import type { ItemInput, Ally } from '../../../types'
import { formatCurrencyCO } from '../../../utils/formatters'
import { TAX_CATEGORIES } from '../../../config/constants'

interface ItemRowProps {
  item: ManagedItem
  aliados?: Ally[]
  onUpdate?: (id: string, updates: Partial<ItemInput>) => void
  onRemove?: (id: string) => void
  readOnly?: boolean
}

export function ItemRow({ item, aliados, onUpdate, onRemove, readOnly = false }: ItemRowProps) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-3 py-2">
        {readOnly ? (
          <span className="text-sm text-slate-900">{item.descripcion}</span>
        ) : (
          <input
            type="text"
            value={item.descripcion}
            onChange={(e) => onUpdate?.(item.id, { descripcion: e.target.value })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Descripción"
          />
        )}
      </td>
      <td className="px-3 py-2">
        {readOnly ? (
          <span className="text-sm text-slate-900 text-right block">{item.cantidad}</span>
        ) : (
          <input
            type="number"
            value={item.cantidad}
            min={0}
            step={1}
            onChange={(e) => onUpdate?.(item.id, { cantidad: Number(e.target.value) })}
            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </td>
      <td className="px-3 py-2">
        {readOnly ? (
          <span className="text-sm text-slate-900 text-right block">{formatCurrencyCO(item.valorUnitario)}</span>
        ) : (
          <input
            type="number"
            value={item.valorUnitario}
            min={0}
            step={1000}
            onChange={(e) => onUpdate?.(item.id, { valorUnitario: Number(e.target.value) })}
            className="w-28 px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </td>
      <td className="px-3 py-2">
        {readOnly ? (
          <span className="text-xs font-mono text-slate-600">{item.categoriaTributaria}</span>
        ) : (
          <select
            value={item.categoriaTributaria}
            onChange={(e) => onUpdate?.(item.id, { categoriaTributaria: e.target.value as ItemInput['categoriaTributaria'] })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {TAX_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </td>
      <td className="px-3 py-2">
        {readOnly ? (
          <span className="text-sm text-slate-600">
            {item.aliadoId ? aliados?.find((a) => a.id === item.aliadoId)?.nombre ?? item.aliadoId : '(Aliado del evento)'}
          </span>
        ) : (
          <select
            value={item.aliadoId ?? ''}
            onChange={(e) => onUpdate?.(item.id, { aliadoId: e.target.value || undefined })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">(Aliado del evento)</option>
            {aliados?.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-right font-medium text-slate-900">
        {formatCurrencyCO(item.totals.base)}
      </td>
      <td className="px-3 py-2 text-sm text-right text-slate-600">
        {formatCurrencyCO(item.totals.impuestos)}
      </td>
      <td className="px-3 py-2 text-sm text-right text-slate-600">
        {formatCurrencyCO(item.totals.feeTotal)}
      </td>
      <td className="px-3 py-2 text-sm text-right font-semibold text-slate-900">
        {formatCurrencyCO(item.totals.total)}
      </td>
      {!readOnly && (
        <td className="px-3 py-2 text-right">
          <button
            onClick={() => onRemove?.(item.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Eliminar ítem"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  )
}
