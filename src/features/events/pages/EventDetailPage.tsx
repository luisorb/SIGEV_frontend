import { ChevronLeft } from 'lucide-react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { EventForm } from '../components/EventForm'
import { useQuery } from '@tanstack/react-query'
import { getEventApi, updateEventApi, getEventsApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useMunicipalities } from '../../../hooks/useMunicipalities'
import { useToast } from '../../../components/ToastProvider'
import type { EventFormValues } from '../schemas/eventSchema'

export function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventApi(id!),
    enabled: !!id,
  })

  const { data: aliados = [] } = useAllies()
  const { data: desembolsos = [] } = useDisbursements()
  const { data: municipios = [] } = useMunicipalities()
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: getEventsApi })

  async function handleSave(data: EventFormValues) {
    if (!event || !id) return

    await updateEventApi(id, {
      ...event,
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
    })

    toast.showToast(`Orden ${data.numeroEvento}${data.sufijo ? `-${data.sufijo}` : ''} actualizada correctamente`)
    navigate('/ordenes')
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Cargando evento...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Evento no encontrado</p>
        <Link to="/ordenes" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium mt-2 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Volver a órdenes
        </Link>
      </div>
    )
  }

  const aliadoName = aliados.find((a) => a.id === event.aliadoId)?.nombre
  const municipioName = municipios.find((m) => m.id === event.municipioId)?.nombre

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
        <h1 className="text-2xl font-bold text-slate-900">Editar {event.numeroEvento}</h1>
        {event && (
          <p className="text-sm text-slate-500">
            {aliadoName} · {municipioName} · {event.items.length} ítems
          </p>
        )}
      </div>

      <EventForm
        event={event}
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
