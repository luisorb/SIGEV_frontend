import { ChevronLeft } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { EventForm } from '../components/EventForm'
import { mockEvents, mockAliados, mockDesembolsos, mockMunicipios } from '../utils/mockData'
import { addAuditEntry } from '../../../lib/auditStore'
import { CURRENT_USER } from '../../../config/constants'
import { useToast } from '../../../components/ToastProvider'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Event } from '../../../types'

export function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [localEvents, setLocalEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('sigev-events')
      return saved ? JSON.parse(saved) : mockEvents
    } catch {
      return mockEvents
    }
  })

  const activeEvents = useMemo(() => localEvents.filter((e) => e.activo !== false), [localEvents])
  const event = localEvents.find((e) => e.id === id)

  function persistEvents(events: Event[]) {
    setLocalEvents(events)
    try {
      localStorage.setItem('sigev-events', JSON.stringify(events))
    } catch { /* silent */ }
  }

  function handleSave(data: EventFormValues) {
    if (!event || !id) return

    const updated = localEvents.map((e) =>
      e.id === id
        ? {
            ...e,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        : e,
    )

    addAuditEntry({
      accion: 'Edición de evento',
      entidad: 'Event',
      entidadId: id,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Evento ${data.numeroEvento}${data.sufijo ? `-${data.sufijo}` : ''} editado`,
    })

    persistEvents(updated)
    toast.showToast(`Orden ${data.numeroEvento}${data.sufijo ? `-${data.sufijo}` : ''} actualizada correctamente`)
    navigate('/ordenes')
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

  const aliadoName = mockAliados.find((a) => a.id === event.aliadoId)?.nombre
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
        aliados={mockAliados}
        desembolsos={mockDesembolsos}
        municipios={mockMunicipios}
        events={activeEvents}
        onSave={handleSave}
        onCancel={() => navigate('/ordenes')}
      />
    </div>
  )
}
