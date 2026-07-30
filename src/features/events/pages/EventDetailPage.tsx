import { ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { EventForm } from '../components/EventForm'
import { getEventApi, updateEventApi, getEventsApi } from '../../../services/events.service'
import { getAliadosSync } from '../../../lib/catalogStore'
import { getDesembolsosSync } from '../../../lib/catalogStore'
import { mockMunicipios } from '../utils/mockData'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { useToast } from '../../../components/ToastProvider'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Event } from '../../../types'

export function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [event, setEvent] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getEventApi(id),
      getEventsApi(),
    ]).then(([evt, allEvents]) => {
      setEvent(evt)
      setEvents(allEvents)
      setLoading(false)
    })
  }, [id])

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

    addAuditEntry({
      accion: 'Edición de evento',
      entidad: 'Event',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Evento ${data.numeroEvento}${data.sufijo ? `-${data.sufijo}` : ''} editado`,
    })

    toast.showToast(`Orden ${data.numeroEvento}${data.sufijo ? `-${data.sufijo}` : ''} actualizada correctamente`)
    navigate('/ordenes')
  }

  if (loading) {
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

  const aliadoName = getAliadosSync().find((a) => a.id === event.aliadoId)?.nombre
  const municipioName = mockMunicipios.find((m) => m.id === event.municipioId)?.nombre

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
        aliados={getAliadosSync()}
        desembolsos={getDesembolsosSync()}
        municipios={mockMunicipios}
        events={events}
        onSave={handleSave}
        onCancel={() => navigate('/ordenes')}
      />
    </div>
  )
}
