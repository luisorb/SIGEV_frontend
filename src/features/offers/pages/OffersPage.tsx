import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useOffers } from '../hooks/useOffers'
import { OfferList } from '../components/OfferList'
import { OfferForm } from '../components/OfferForm'
import { OfferItems } from '../components/OfferItems'
import type { OfferInput, OfferItemInput } from '../types'
import { OFFER_STATES, OFFER_STATE_COLORS, type OfferState } from '../types'
import { formatDateCO } from '../../../utils/formatters'

type View = 'list' | 'create' | 'detail'

export function OffersPage() {
  const {
    offers,
    search,
    setSearch,
    getOffer,
    createOffer,
    updateOffer,
    changeState,
    addItem,
    updateItem,
    removeItem: removeItemFromOffer,
  } = useOffers()

  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<OfferItemInput>({ descripcion: '', cantidad: 1, valorUnitario: 0 })

  const selectedOffer = selectedId ? getOffer(selectedId) : null

  function handleCreate(input: OfferInput) {
    const offer = createOffer(input)
    setSelectedId(offer.id)
    setView('detail')
  }

  function handleSave(input: OfferInput) {
    if (selectedId) {
      updateOffer(selectedId, input)
    }
  }

  function handleAddItem() {
    if (!selectedId) return
    addItem(selectedId, newItem)
    setNewItem({ descripcion: '', cantidad: 1, valorUnitario: 0 })
  }

  function handleView(id: string) {
    setSelectedId(id)
    setView('detail')
  }

  if (view === 'create') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setView('list')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a ofertas
        </button>
        <OfferForm onSave={handleCreate} onCancel={() => setView('list')} />
      </div>
    )
  }

  if (view === 'detail' && selectedOffer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setView('list'); setSelectedId(null) }}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a ofertas
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{selectedOffer.nombre}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedOffer.codigo} · {selectedOffer.cliente} · Creada {formatDateCO(selectedOffer.createdAt)}
              </p>
            </div>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${OFFER_STATE_COLORS[selectedOffer.estado]}`}>
              {selectedOffer.estado}
            </span>
          </div>
          {selectedOffer.descripcion && (
            <p className="text-sm text-slate-600 mb-4">{selectedOffer.descripcion}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {OFFER_STATES.map((s) => (
              <button
                key={s}
                onClick={() => changeState(selectedOffer.id, s as OfferState)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  s === selectedOffer.estado
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <OfferForm offer={selectedOffer} onSave={handleSave} onCancel={() => setView('list')} />

        <OfferItems
          offer={selectedOffer}
          onAddItem={handleAddItem}
          onUpdateItem={(itemId, input) => updateItem(selectedOffer.id, itemId, input)}
          onRemoveItem={(itemId) => removeItemFromOffer(selectedOffer.id, itemId)}
          newItem={newItem}
          onNewItemChange={setNewItem}
        />
      </div>
    )
  }

  return (
    <OfferList
      offers={offers}
      search={search}
      onSearchChange={setSearch}
      onView={handleView}
      onCreate={() => setView('create')}
    />
  )
}
