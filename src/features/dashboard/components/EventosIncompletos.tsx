import { AlertTriangle } from 'lucide-react'
import type { EventoIncompleto } from '../types'
import { Link } from 'react-router-dom'

interface EventosIncompletosProps {
  events: EventoIncompleto[]
}

export function EventosIncompletos({ events }: EventosIncompletosProps) {
  if (events.length === 0) return null

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-900">Alertas de Eventos Incompletos</h3>
        <span className="text-xs text-amber-700 ml-auto">{events.length} evento(s)</span>
      </div>
      <div className="divide-y divide-amber-200">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/ordenes/${event.id}`}
            className="px-5 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
          >
            <div>
              <span className="text-sm font-medium text-amber-900">
                {event.numeroEvento}{event.sufijo ? `-${event.sufijo}` : ''}
              </span>
              <span className="text-xs text-amber-700 ml-2">{event.responsable}</span>
            </div>
            <span className="text-xs font-medium text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
              {event.motivo}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
