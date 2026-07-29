import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { EventForm } from '../components/EventForm'
import { mockEvents, getMockAliados, getMockDesembolsos, mockMunicipios } from '../utils/mockData'
import { addAuditEntry } from '../../../lib/auditStore'
import { CURRENT_USER } from '../../../config/constants'
import { useToast } from '../../../components/ToastProvider'
import type { EventFormValues } from '../schemas/eventSchema'
import type { Event } from '../../../types'

export function EventCreatePage() {
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

  function persistEvents(events: Event[]) {
    setLocalEvents(events)
    try {
      localStorage.setItem('sigev-events', JSON.stringify(events))
    } catch { /* silent */ }
  }

  function handleSave(data: EventFormValues) {
    const newId = `EVT-${String(localEvents.length + 1).padStart(3, '0')}`

    const newEvent: Event = {
      id: newId,
      numeroEvento: data.numeroEvento,
      sufijo: data.sufijo ?? '',
      responsable: data.responsable,
      dependencia: data.dependencia ?? '',
      municipioId: data.municipioId,
      aliadoId: data.aliadoId,
      desembolsoId: data.desembolsoId,
      esquema: data.esquema,
      estado: 'Abierto',
      fechaEvento: data.fechaEvento ?? '',
      asistentes: data.asistentes ?? 0,
      dias: data.dias ?? 0,
      vereda: data.vereda ?? '',
      latitud: data.latitud || undefined,
      longitud: data.longitud || undefined,
      observaciones: data.observaciones ?? '',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addAuditEntry({
      accion: 'Creación de evento',
      entidad: 'Event',
      entidadId: newEvent.id,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Evento ${newEvent.numeroEvento}${newEvent.sufijo ? `-${newEvent.sufijo}` : ''} creado`,
    })

    persistEvents([newEvent, ...localEvents])
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
        aliados={getMockAliados()}
        desembolsos={getMockDesembolsos()}
        municipios={mockMunicipios}
        events={activeEvents}
        onSave={handleSave}
        onCancel={() => navigate('/ordenes')}
      />
    </div>
  )
}
