import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { EventoIncompleto } from '../types'
import { Link } from 'react-router-dom'

interface EventosIncompletosProps {
  events: EventoIncompleto[]
}

export function EventosIncompletos({ events }: EventosIncompletosProps) {
  if (events.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-amber-200">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-amber-900">Alertas de Eventos Incompletos</h3>
          <p className="text-xs text-amber-700">{events.length} evento(s) requieren atención</p>
        </div>
      </div>
      <div className="divide-y divide-amber-200">
        {events.map((event) => (
          <Link
            key={event.id}
            to={`/ordenes/${event.id}`}
            className="px-5 py-3 flex items-center justify-between hover:bg-amber-100/50 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <span className="text-sm font-medium text-amber-900">
                  {event.numeroEvento}{event.sufijo ? `-${event.sufijo}` : ''}
                </span>
                <span className="text-xs text-amber-700 ml-2">{event.responsable}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {event.motivo}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
