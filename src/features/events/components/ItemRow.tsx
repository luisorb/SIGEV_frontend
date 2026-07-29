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
  index?: number
}

const categoryBadges: Record<string, string> = {
  IVA: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  Consumo: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Tercero: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  Reembolso: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
}

export function ItemRow({ item, aliados, onUpdate, onRemove, readOnly = false, index = 0 }: ItemRowProps) {
  return (
    <tr className={`transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/20`}>
      <td className="px-5 py-3">
        {readOnly ? (
          <span className="text-sm font-medium text-slate-900">{item.descripcion}</span>
        ) : (
          <input
            type="text"
            value={item.descripcion}
            onChange={(e) => onUpdate?.(item.id, { descripcion: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150"
            placeholder="Descripción"
          />
        )}
      </td>
      <td className="px-5 py-3">
        {readOnly ? (
          <span className="text-sm text-slate-900 block text-right tabular-nums">{item.cantidad}</span>
        ) : (
          <input
            type="number"
            value={item.cantidad}
            min={0}
            step={1}
            onChange={(e) => onUpdate?.(item.id, { cantidad: Number(e.target.value) })}
            className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 tabular-nums"
          />
        )}
      </td>
      <td className="px-5 py-3">
        {readOnly ? (
          <span className="text-sm text-slate-900 block text-right tabular-nums">{formatCurrencyCO(item.valorUnitario)}</span>
        ) : (
          <input
            type="number"
            value={item.valorUnitario}
            min={0}
            step={1000}
            onChange={(e) => onUpdate?.(item.id, { valorUnitario: Number(e.target.value) })}
            className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 tabular-nums"
          />
        )}
      </td>
      <td className="px-5 py-3">
        {readOnly ? (
          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md ${categoryBadges[item.categoriaTributaria] || 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}>
            {item.categoriaTributaria}
          </span>
        ) : (
          <select
            value={item.categoriaTributaria}
            onChange={(e) => onUpdate?.(item.id, { categoriaTributaria: e.target.value as ItemInput['categoriaTributaria'] })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150"
          >
            {TAX_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </td>
      <td className="px-5 py-3">
        {readOnly ? (
          <span className="text-sm text-slate-600">
            {item.aliadoId ? aliados?.find((a) => a.id === item.aliadoId)?.nombre ?? item.aliadoId : (
              <span className="text-slate-400 italic">Del evento</span>
            )}
          </span>
        ) : (
          <select
            value={item.aliadoId ?? ''}
            onChange={(e) => onUpdate?.(item.id, { aliadoId: e.target.value || undefined })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150"
          >
            <option value="">(Aliado del evento)</option>
            {aliados?.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        )}
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
