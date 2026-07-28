import { useState } from 'react'
import { Modal } from '../../../layout/Modal'
import { OfferForm } from './OfferForm'
import type { Offer, OfferInput, OfferItemInput, OfferState } from '../types'
import { OFFER_STATES, OFFER_STATE_COLORS } from '../types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { TAX_CATEGORIES } from '../../../config/constants'

type ModalMode = 'create' | 'view' | 'edit'

interface OfferDetailModalProps {
  isOpen: boolean
  mode: ModalMode
  offer?: Offer
  onClose: () => void
  onCreate: (input: OfferInput) => Offer
  onUpdate: (id: string, input: Partial<OfferInput>) => void
  onChangeState?: (id: string, estado: OfferState) => void
  onAddItem: (offerId: string, input: OfferItemInput) => void
  onUpdateItem: (offerId: string, itemId: string, input: Partial<OfferItemInput>) => void
  onRemoveItem: (offerId: string, itemId: string) => void
}

export function OfferDetailModal({
  isOpen,
  mode,
  offer,
  onClose,
  onCreate,
  onUpdate,
  onChangeState,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: OfferDetailModalProps) {
  const isNew = mode === 'create'
  const isView = mode === 'view'

  const [newItem, setNewItem] = useState<OfferItemInput>({
    descripcion: '',
    cantidad: 1,
    valorUnitario: 0,
    categoriaTributaria: 'IVA',
  })

  function handleCreate(input: OfferInput) {
    onCreate(input)
    onClose()
  }

  function handleEditSave(input: OfferInput) {
    if (offer) {
      onUpdate(offer.id, input)
    }
  }

  function handleAddItem() {
    if (!offer) return
    onAddItem(offer.id, newItem)
    setNewItem({ descripcion: '', cantidad: 1, valorUnitario: 0, categoriaTributaria: 'IVA' })
  }

  const title = isNew ? 'Nueva Oferta' : isView ? (offer?.nombre ?? '') : `Editar ${offer?.nombre ?? ''}`
  const subtitle = offer && !isNew
    ? `${offer.codigo} · ${offer.cliente}`
    : undefined

  function ItemsTable({ editable }: { editable: boolean }) {
    if (!offer) return null
    return (
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Descripción</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Cant.</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Vr. Unitario</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Cat.</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Base</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">IVA</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Fee</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">IVA Fee</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
              {editable && <th className="px-4 py-2.5 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offer.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2">
                  {editable ? (
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => onUpdateItem(offer.id, item.id, { descripcion: e.target.value })}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 outline-none"
                    />
                  ) : (
                    <span className="text-slate-900">{item.descripcion}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editable ? (
                    <input
                      type="number"
                      min={1}
                      value={item.cantidad}
                      onChange={(e) => onUpdateItem(offer.id, item.id, { cantidad: Number(e.target.value) || 0 })}
                      className="w-16 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 outline-none"
                    />
                  ) : (
                    <span className="text-slate-600 text-right block">{item.cantidad}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      value={item.valorUnitario}
                      onChange={(e) => onUpdateItem(offer.id, item.id, { valorUnitario: Number(e.target.value) || 0 })}
                      className="w-24 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-sm text-slate-900 outline-none"
                    />
                  ) : (
                    <span className="text-slate-600 text-right block">{formatCurrencyCO(item.valorUnitario)}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {editable ? (
                    <select
                      value={item.categoriaTributaria}
                      onChange={(e) => onUpdateItem(offer.id, item.id, { categoriaTributaria: e.target.value as any })}
                      className="text-xs border border-slate-300 rounded px-1 py-0.5"
                    >
                      {TAX_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">{item.categoriaTributaria}</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.base)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.iva)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.feeTarifado + item.feeTerceros)}</td>
                <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.ivaFee)}</td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatCurrencyCO(item.total)}</td>
                {editable && (
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onRemoveItem(offer.id, item.id)}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {offer.items.length > 0 && (
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-slate-900">Totales</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.subtotal)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.ivaTotal)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.ivaFeeTotal)}</td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrencyCO(offer.total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} size="full">
      {isView && offer && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${OFFER_STATE_COLORS[offer.estado]}`}>
                {offer.estado}
              </span>
              {onChangeState && (
                <select
                  value={offer.estado}
                  onChange={(e) => onChangeState(offer.id, e.target.value as OfferState)}
                  className="text-xs border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  {OFFER_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
            <span className="text-sm text-slate-500">
              Creada {formatDateCO(offer.createdAt)} · Actualizada {formatDateCO(offer.updatedAt)}
            </span>
          </div>

          {offer.descripcion && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">{offer.descripcion}</p>
          )}

          <div className="grid grid-cols-4 gap-4 bg-white rounded-lg border border-slate-200 p-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Código</p>
              <p className="text-sm font-medium text-slate-900">{offer.codigo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Cliente</p>
              <p className="text-sm font-medium text-slate-900">{offer.cliente}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Ítems</p>
              <p className="text-sm font-medium text-slate-900">{offer.items.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
              <p className="text-sm font-bold text-slate-900">{formatCurrencyCO(offer.total)}</p>
            </div>
          </div>

          {offer.items.length > 0 ? <ItemsTable editable={false} /> : (
            <p className="text-sm text-slate-400 italic">Sin ítems</p>
          )}
        </div>
      )}

      {mode === 'edit' && offer && (
        <div className="space-y-6">
          <OfferForm offer={offer} onSave={handleEditSave} onCancel={onClose} />
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Ítems de la Oferta</h3>
            </div>
            {offer.items.length > 0 ? <ItemsTable editable /> : (
              <p className="text-sm text-slate-400 italic px-5 py-4">Sin ítems</p>
            )}
            <div className="border-t border-slate-200 px-4 py-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-slate-500 mb-1">Descripción</label>
                  <input
                    type="text"
                    value={newItem.descripcion}
                    onChange={(e) => setNewItem((p) => ({ ...p, descripcion: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Nuevo ítem"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cant.</label>
                  <input
                    type="number"
                    min={1}
                    value={newItem.cantidad}
                    onChange={(e) => setNewItem((p) => ({ ...p, cantidad: Number(e.target.value) || 0 }))}
                    className="w-16 px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Vr. Unit.</label>
                  <input
                    type="number"
                    min={0}
                    value={newItem.valorUnitario}
                    onChange={(e) => setNewItem((p) => ({ ...p, valorUnitario: Number(e.target.value) || 0 }))}
                    className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cat.</label>
                  <select
                    value={newItem.categoriaTributaria}
                    onChange={(e) => setNewItem((p) => ({ ...p, categoriaTributaria: e.target.value as any }))}
                    className="px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {TAX_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.descripcion || newItem.cantidad < 1 || newItem.valorUnitario < 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <OfferForm onSave={handleCreate} onCancel={onClose} />
      )}
    </Modal>
  )
}
