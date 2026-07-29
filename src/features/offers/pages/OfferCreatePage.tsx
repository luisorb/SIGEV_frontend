import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ChevronLeft, FileSpreadsheet } from 'lucide-react'
import { OfferForm } from '../components/OfferForm'
import { useOffers } from '../hooks/useOffers'
import { useToast } from '../../../components/ToastProvider'
import type { Event } from '../../../types'

export function OfferCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const eventoId = searchParams.get('eventoId')
  const { createOffer } = useOffers()

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

  if (eventoId) {
    try {
      const saved = localStorage.getItem('sigev-events')
      if (saved) {
        const events: Event[] = JSON.parse(saved)
        const ev = events.find((e) => e.id === eventoId)
        if (ev) {
          eventDefaults = {
            eventoId: ev.id,
            numeroEvento: ev.numeroEvento + (ev.sufijo ? `-${ev.sufijo}` : ''),
            responsable: ev.responsable,
            dependencia: ev.dependencia,
            municipio: ev.municipioId,
            aliado: ev.aliadoId,
            desembolso: ev.desembolsoId,
            esquema: ev.esquema,
          }
        }
      }
    } catch { /* silent */ }
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
    createOffer(data)
    toast.showToast(`Oferta ${data.codigo} creada correctamente`)
    navigate(eventoId ? `/ordenes/${eventoId}` : '/ofertas')
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
            {eventDefaults.municipio && <span>· {eventDefaults.municipio}</span>}
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
