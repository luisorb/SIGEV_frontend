import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { TaxCategory } from '../../../types'
import type { Offer, OfferItemInput } from '../types'
import { TAX_CATEGORIES } from '../../../config/constants'
import { formatCurrencyCO } from '../../../utils/formatters'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { getTariffsApi, getTariffPriceApi } from '../../../services/tariffs.service'

interface OfferItemsProps {
  offer: Offer
  onAddItem: () => void
  onUpdateItem: (itemId: string, input: Partial<OfferItemInput>) => void
  onRemoveItem: (itemId: string) => void
  newItem: OfferItemInput
  onNewItemChange: (input: OfferItemInput) => void
}

export function OfferItems({ offer, onAddItem, onUpdateItem, onRemoveItem, newItem, onNewItemChange }: OfferItemsProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [resolvingTariff, setResolvingTariff] = useState(false)

  const { data: tariffs = [] } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => getTariffsApi({ tariffType: 'TARIFADO' }),
  })

  async function handleSelectTariff(tariffId: string) {
    if (!tariffId) {
      onNewItemChange({ ...newItem, tariffId: undefined })
      return
    }
    const tariff = tariffs.find((t) => t.id === tariffId)
    if (!tariff) return
    setResolvingTariff(true)
    try {
      const update: OfferItemInput = {
        ...newItem,
        tariffId,
        descripcion: tariff.name,
        valorUnitario: 0,
      }
      if (offer.municipalityCategory) {
        const price = await getTariffPriceApi(tariffId, offer.municipalityCategory)
        update.valorUnitario = price
      }
      onNewItemChange(update)
    } catch {
      onNewItemChange({ ...newItem, tariffId, descripcion: tariff.name })
    } finally {
      setResolvingTariff(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Ítems de la Oferta</h3>
      </div>

      {offer.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cant.</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Vr. Unitario</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Cat.</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Base</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">IVA</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offer.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => onUpdateItem(item.id, { descripcion: e.target.value })}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary text-sm text-slate-900 outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => onUpdateItem(item.id, { cantidad: Number(e.target.value) || 0 })}
                      className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary text-sm text-slate-900 outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={item.valorUnitario}
                      onChange={(e) => onUpdateItem(item.id, { valorUnitario: Number(e.target.value) || 0 })}
                      className="w-24 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary text-sm text-slate-900 outline-none"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <select
                      value={item.categoriaTributaria}
                      onChange={(e) => onUpdateItem(item.id, { categoriaTributaria: e.target.value as TaxCategory })}
                      className="text-xs border border-slate-300 rounded px-1 py-0.5 focus:ring-2 focus:ring-primary"
                    >
                      {TAX_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">{formatCurrencyCO(item.base)}</td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">{formatCurrencyCO(item.iva)}</td>
                  <td className="px-4 py-2 text-sm text-right text-slate-600">{formatCurrencyCO(item.feeTarifado + item.feeTerceros)}</td>
                  <td className="px-4 py-2 text-sm text-right font-semibold text-slate-900">{formatCurrencyCO(item.total)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Eliminar ítem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          isOpen
          title="Eliminar ítem"
          message="¿Estás seguro de eliminar este ítem de la oferta? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => {
            onRemoveItem(confirmDelete)
            setConfirmDelete(null)
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <div className="border-t border-slate-200 px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-auto">
            <label className="block text-xs text-slate-500 mb-1">Tarifario</label>
            <select
              value={newItem.tariffId ?? ''}
              onChange={(e) => handleSelectTariff(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary max-w-[280px]"
            >
              <option value="">Valor manual</option>
              {tariffs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} · {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-500 mb-1">Descripción</label>
            <input
              type="text"
              value={newItem.descripcion}
              onChange={(e) => onNewItemChange({ ...newItem, descripcion: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nuevo ítem"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Cant.</label>
            <input
              type="number"
              min={1}
              value={newItem.cantidad}
              onChange={(e) => onNewItemChange({ ...newItem, cantidad: Number(e.target.value) || 0 })}
              className="w-16 px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Vr. Unit.</label>
            <input
              type="number"
              min={0}
              value={newItem.valorUnitario}
              onChange={(e) => onNewItemChange({ ...newItem, valorUnitario: Number(e.target.value) || 0 })}
              className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Cat.</label>
            <select
              value={newItem.categoriaTributaria}
              onChange={(e) => onNewItemChange({ ...newItem, categoriaTributaria: e.target.value as TaxCategory })}
              className="px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary"
            >
              {TAX_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={onAddItem}
            disabled={!newItem.descripcion || newItem.cantidad < 1 || newItem.valorUnitario < 1 || resolvingTariff}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            {resolvingTariff ? 'Cargando...' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex items-center justify-end gap-6 text-sm">
        <span className="text-slate-600">
          Subtotal: <strong className="text-slate-900">{formatCurrencyCO(offer.subtotal)}</strong>
        </span>
        <span className="text-slate-600">
          IVA: <strong className="text-slate-900">{formatCurrencyCO(offer.ivaTotal)}</strong>
        </span>
        <span className="text-slate-600">
          Fee: <strong className="text-slate-900">{formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal)}</strong>
        </span>
        <span className="text-slate-900 font-bold text-base">
          Total: {formatCurrencyCO(offer.total)}
        </span>
      </div>
    </div>
  )
}
