import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { OfferForm } from '../components/OfferForm'
import { OfferItems } from '../components/OfferItems'
import { useOffers } from '../hooks/useOffers'
import { useToast } from '../../../components/ToastProvider'
import type { OfferItemInput } from '../types'

export function OfferEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { getOffer, updateOffer, addItem, updateItem, removeItem } = useOffers()
  const offer = id ? getOffer(id) : undefined
  const offerId = offer?.id

  const [newItem, setNewItem] = useState<OfferItemInput>({
    descripcion: '',
    cantidad: 1,
    valorUnitario: 0,
    categoriaTributaria: 'IVA',
  })

  if (!offer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Oferta no encontrada</p>
        <Link
          to="/ofertas"
          className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium mt-3 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Volver a ofertas
        </Link>
      </div>
    )
  }

  function handleSave(data: {
    codigo: string
    nombre: string
    descripcion: string
    cliente: string
    eventoId?: string
    numeroEvento?: string
    responsable?: string
    dependencia?: string
    municipio?: string
    aliado?: string
    desembolso?: string
    esquema?: string
  }) {
    if (!offerId) return
    updateOffer(offerId, data)
    toast.showToast(`Oferta ${data.codigo} actualizada correctamente`)
    navigate('/ofertas')
  }

  function handleAddItem() {
    if (!offerId) return
    addItem(offerId, newItem)
    setNewItem({ descripcion: '', cantidad: 1, valorUnitario: 0, categoriaTributaria: 'IVA' })
  }

  function handleUpdateItem(itemId: string, input: Partial<OfferItemInput>) {
    if (!offerId) return
    updateItem(offerId, itemId, input)
  }

  function handleRemoveItem(itemId: string) {
    if (!offerId) return
    removeItem(offerId, itemId)
  }

  const aliadoName = offer?.aliado
  const municipioName = offer?.municipio

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/ofertas/${offer.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a detalle
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar {offer.codigo}</h1>
        {offer && (
          <p className="text-sm text-slate-500">
            {aliadoName || ''}{aliadoName && municipioName ? ' · ' : ''}{municipioName || ''}{offer.items.length ? ` · ${offer.items.length} ítems` : ''}
          </p>
        )}
      </div>

      <OfferForm offer={offer} onSave={handleSave} onCancel={() => navigate(`/ofertas/${offer.id}`)} />

      <OfferItems
        offer={offer}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        newItem={newItem}
        onNewItemChange={setNewItem}
      />
    </div>
  )
}
