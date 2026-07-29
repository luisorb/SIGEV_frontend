import { Plus, FileSpreadsheet } from 'lucide-react'
import type { ManagedItem } from '../hooks/useItems'
import type { ItemInput, EventTotals, Ally } from '../../../types'
import { ItemRow } from './ItemRow'
import { formatCurrencyCO } from '../../../utils/formatters'

interface ItemManagerProps {
  items: ManagedItem[]
  aliados?: Ally[]
  onAddItem?: (item: ItemInput) => void
  onUpdateItem?: (id: string, updates: Partial<ItemInput>) => void
  onRemoveItem?: (id: string) => void
  eventTotals: EventTotals
  onOpenImport?: () => void
  readOnly?: boolean
}

const defaultItem: ItemInput = {
  descripcion: '',
  cantidad: 1,
  valorUnitario: 0,
  categoriaTributaria: 'IVA',
  aliadoId: undefined,
}

export function ItemManager({
  items,
  aliados,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  eventTotals,
  onOpenImport,
  readOnly = false,
}: ItemManagerProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </span>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ítems del Evento</h2>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              {onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Importar Excel
                </button>
              )}
              {onAddItem && (
                <button
                  onClick={() => onAddItem(defaultItem)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Ítem
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cant.</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vr. Unitario</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aliado</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Base</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Impuestos</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              {!readOnly && <th className="px-3 py-2.5 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 9 : 10} className="px-3 py-8 text-center text-sm text-slate-400">
                  {readOnly ? 'Sin ítems' : 'No hay ítems. Agrega uno manualmente o importa desde Excel.'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  aliados={aliados}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                  readOnly={readOnly}
                />
              ))
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={5} className="px-3 py-2.5 text-sm font-semibold text-slate-900">
                  Totales del Evento
                </td>
                <td className="px-3 py-2.5 text-sm text-right font-semibold text-slate-900">
                  {formatCurrencyCO(eventTotals.baseTotal)}
                </td>
                <td className="px-3 py-2.5 text-sm text-right font-semibold text-slate-900">
                  {formatCurrencyCO(eventTotals.impuestosTotal)}
                </td>
                <td className="px-3 py-2.5 text-sm text-right font-semibold text-slate-900">
                  {formatCurrencyCO(eventTotals.feeTotal)}
                </td>
                <td className="px-3 py-2.5 text-sm text-right font-bold text-slate-900">
                  {formatCurrencyCO(eventTotals.granTotal)}
                </td>
                {!readOnly && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
