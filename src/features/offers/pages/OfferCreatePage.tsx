import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, FileSpreadsheet } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { OfferForm } from '../components/OfferForm'
import { useOffers } from '../hooks/useOffers'
import { useToast } from '../../../components/ToastProvider'
import { getEventApi } from '../../../services/events.service'
import { getApiErrorMessage } from '../../../lib/apiErrors'

export function OfferCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const eventoId = searchParams.get('eventoId')
  const { createOffer } = useOffers()

  const { data: event } = useQuery({
    queryKey: ['event', eventoId],
    queryFn: () => getEventApi(eventoId!),
    enabled: !!eventoId,
  })

  let eventDefaults: Partial<{
    eventoId: string
    numeroEvento: string
    responsable: string
    dependencia: string
    municipio: string
    aliado: string
    desembolso: string
    esquema: string
  }> | undefined

  if (event) {
    eventDefaults = {
      eventoId: event.id,
      numeroEvento: event.numeroEvento + (event.sufijo ? `-${event.sufijo}` : ''),
      responsable: event.responsable,
      dependencia: event.dependencia,
      municipio: event.municipioId,
      aliado: event.aliadoId,
      desembolso: event.desembolsoId,
      esquema: event.esquema,
    }
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
    try {
      await createOffer(data)
      toast.showToast(`Oferta ${data.codigo} creada correctamente`)
      navigate(eventoId ? `/ordenes/${eventoId}` : '/ofertas')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo crear la oferta'), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={eventoId ? `/ordenes/${eventoId}` : '/ofertas'}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {eventoId ? 'Volver a la orden' : 'Volver a ofertas'}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nueva Oferta</h1>
        {eventDefaults && (
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
            <FileSpreadsheet className="w-4 h-4" />
            Asociada al evento {eventDefaults.numeroEvento}
          </div>
        )}
      </div>

      <OfferForm
        key={eventoId || 'new'}
        initialData={eventDefaults}
        onSave={handleSave}
        onCancel={() => navigate(eventoId ? `/ordenes/${eventoId}` : '/ofertas')}
      />
    </div>
  )
}
