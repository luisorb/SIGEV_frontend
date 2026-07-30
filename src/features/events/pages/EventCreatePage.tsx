import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { EventForm } from '../components/EventForm'
import { createEventApi, getEventsApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useMunicipalities } from '../../../hooks/useMunicipalities'
import { useToast } from '../../../components/ToastProvider'
import { useQuery } from '@tanstack/react-query'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Event } from '../../../types'

export function EventCreatePage() {
  const navigate = useNavigate()
  const toast = useToast()

  const { data: aliados = [] } = useAllies()
  const { data: desembolsos = [] } = useDisbursements()
  const { data: municipios = [] } = useMunicipalities()
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: getEventsApi })

  async function handleSave(data: EventFormValues) {
    const partial: Partial<Event> = {
      numeroEvento: data.numeroEvento,
      sufijo: data.sufijo ?? '',
      responsable: data.responsable,
      dependencia: data.dependencia ?? '',
      municipioId: data.municipioId,
      aliadoId: data.aliadoId,
      desembolsoId: data.desembolsoId,
      esquema: data.esquema,
      fechaEvento: data.fechaEvento ?? '',
      asistentes: data.asistentes ?? 0,
      dias: data.dias ?? 0,
      vereda: data.vereda ?? '',
      latitud: data.latitud || undefined,
      longitud: data.longitud || undefined,
      observaciones: data.observaciones ?? '',
    }

    const newEvent = await createEventApi(partial)

    toast.showToast(`Orden ${newEvent.numeroEvento}${newEvent.sufijo ? `-${newEvent.sufijo}` : ''} creada correctamente`)
    navigate('/ordenes')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/ordenes"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium mb-2 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a órdenes
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Nueva Orden</h1>
      </div>

      <EventForm
        aliados={aliados}
        desembolsos={desembolsos}
        municipios={municipios}
        events={events}
        onSave={handleSave}
        onCancel={() => navigate('/ordenes')}
      />
    </div>
  )
}
