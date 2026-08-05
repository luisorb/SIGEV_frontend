import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { OfferForm } from '../components/OfferForm'
import { useOffers } from '../hooks/useOffers'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'

export function OfferEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { getOffer, updateOffer, isLoading } = useOffers()
  const offer = id ? getOffer(id) : undefined
  const offerId = offer?.id

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Cargando oferta...</p>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Oferta no encontrada</p>
        <Link
          to="/ofertas"
          className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium mt-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a ofertas
        </Link>
      </div>
    )
  }

  async function handleSave(data: {
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
    try {
      await updateOffer(offerId, data)
      toast.showToast(`Oferta ${data.codigo} actualizada correctamente`)
      navigate('/ofertas')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo actualizar la oferta'), 'error')
    }
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
            {aliadoName || ''}{aliadoName && municipioName ? ' · ' : ''}{municipioName || ''}
          </p>
        )}
      </div>

      <OfferForm offer={offer} onSave={handleSave} onCancel={() => navigate(`/ofertas/${offer.id}`)} />
    </div>
  )
}
