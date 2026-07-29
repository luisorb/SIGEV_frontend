import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Pencil, ChevronLeft, Tag, MapPin } from 'lucide-react'
import { ItemManager } from '../components/ItemManager'
import { useItems } from '../hooks/useItems'
import { mockEvents, mockAliados, mockDesembolsos, mockMunicipios } from '../utils/mockData'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { EVENT_STATES, CURRENT_USER } from '../../../config/constants'
import { addAuditEntry } from '../../../lib/auditStore'
import { addStateHistoryEntry, getStateHistory } from '../../../lib/stateHistoryStore'
import type { Event, EventState } from '../../../types'

export function EventViewPage() {
  const { id } = useParams()

  const [localEvents, setLocalEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('sigev-events')
      return saved ? JSON.parse(saved) : mockEvents
    } catch {
      return mockEvents
    }
  })

  const event = localEvents.find((e) => e.id === id)

  const [showHistory, setShowHistory] = useState(false)
  const [currentEstado, setCurrentEstado] = useState<string>(event?.estado ?? '')

  const {
    items,
    eventTotals,
  } = useItems(
    event?.items.map((i) => ({
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      valorUnitario: i.valorUnitario,
      categoriaTributaria: i.categoriaTributaria,
      aliadoId: i.aliadoId,
    })),
    event?.aliadoId,
  )

  const stateHistory = event ? getStateHistory(event.id) : []

  const estadoColors: Record<string, string> = {
    Abierto: 'bg-yellow-100 text-yellow-800',
    'En ejecucion': 'bg-red-100 text-red-800',
    Ejecutado: 'bg-green-100 text-green-800',
    Cerrado: 'bg-slate-100 text-slate-800',
    Legalizado: 'bg-purple-100 text-purple-800',
  }

  function persistEvents(events: Event[]) {
    setLocalEvents(events)
    try {
      localStorage.setItem('sigev-events', JSON.stringify(events))
    } catch { /* silent */ }
  }

  function handleStateChange(newEstado: string) {
    if (!event) return
    const oldEstado = event.estado
    if (oldEstado === newEstado) return

    const updated = localEvents.map((e) =>
      e.id === event.id ? { ...e, estado: newEstado as EventState, updatedAt: new Date().toISOString() } : e,
    )
    persistEvents(updated)
    setCurrentEstado(newEstado)

    addStateHistoryEntry({
      eventoId: event.id,
      estadoAnterior: oldEstado,
      estadoNuevo: newEstado as EventState,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      motivo: '',
    })
    addAuditEntry({
      accion: 'Cambio de estado',
      entidad: 'Event',
      entidadId: event.id,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Estado cambiado de ${oldEstado} a ${newEstado}`,
      valorAnterior: oldEstado,
      valorNuevo: newEstado,
    })
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Evento no encontrado</p>
        <Link to="/ordenes" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm mt-3 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Volver a órdenes
        </Link>
      </div>
    )
  }

  const aliado = mockAliados.find((a) => a.id === event.aliadoId)
  const municipio = mockMunicipios.find((m) => m.id === event.municipioId)
  const desembolso = mockDesembolsos.find((d) => d.id === event.desembolsoId)

  const label = (text: string) => (
    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">{text}</p>
  )

  const value = (text: string) => (
    <p className="text-sm font-medium text-slate-900">{text}</p>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="min-w-0">
          <Link
            to="/ordenes"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Volver a órdenes
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            Orden {event.numeroEvento}{event.sufijo ? `-${event.sufijo}` : ''}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            {aliado && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Tag className="w-3.5 h-3.5" />
                {aliado.nombre}
              </div>
            )}
            {municipio && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                {municipio.nombre}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              {event.items.length} ítem{event.items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <Link
          to={`/ordenes/${event.id}/editar`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150 shrink-0"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Detalles de la Orden</h2>
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-5 gap-y-4">
          <div>
            {label('Número')}
            {value(`${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`)}
          </div>
          <div>
            {label('Responsable')}
            {value(event.responsable || '-')}
          </div>
          <div>
            {label('Dependencia')}
            {value(event.dependencia || '-')}
          </div>
          <div>
            {label('Fecha')}
            {value(event.fechaEvento ? formatDateCO(event.fechaEvento) : '-')}
          </div>
          <div>
            {label('Municipio')}
            {value(municipio ? `${municipio.nombre} (${municipio.departamento})` : event.municipioId)}
          </div>
          <div>
            {label('Vereda')}
            {value(event.vereda || '-')}
          </div>
          <div>
            {label('Aliado')}
            {value(aliado?.nombre ?? event.aliadoId)}
          </div>
          <div>
            {label('Desembolso')}
            {value(desembolso?.nombre ?? event.desembolsoId)}
          </div>
          <div>
            {label('Esquema')}
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded capitalize">
              {event.esquema}
            </span>
          </div>
          <div>
            {label('Asistentes')}
            {value(String(event.asistentes))}
          </div>
          <div>
            {label('Días')}
            {value(String(event.dias))}
          </div>
          <div>
            {label('Coordenadas')}
            {value(
              event.latitud && event.longitud
                ? `${event.latitud}, ${event.longitud}`
                : 'No registradas',
            )}
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Estado</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${estadoColors[currentEstado || event.estado] || 'bg-slate-100 text-slate-800'}`}>
                {currentEstado || event.estado}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Cambiar a</span>
              <select
                value={currentEstado || event.estado}
                onChange={(e) => handleStateChange(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150"
              >
                {EVENT_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {stateHistory.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs text-primary hover:text-primary-dark underline whitespace-nowrap"
                >
                  {showHistory ? 'Ocultar historial' : 'Ver historial'}
                </button>
              )}
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Base</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrencyCO(eventTotals.baseTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Impuestos</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrencyCO(eventTotals.impuestosTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Fee</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrencyCO(eventTotals.feeTotal)}</p>
              </div>
              <div className="text-right pl-4 border-l border-slate-200">
                <p className="text-[11px] text-primary/60 uppercase tracking-wider font-semibold">Total</p>
                <p className="text-base font-bold text-primary">{formatCurrencyCO(eventTotals.granTotal)}</p>
              </div>
            </div>
          </div>
          {showHistory && stateHistory.length > 0 && (
            <div className="mx-5 mb-3 bg-slate-50 rounded-lg p-3 space-y-1.5 border border-slate-100">
              {stateHistory.map((h) => (
                <div key={h.id} className="text-xs text-slate-500 flex items-start gap-2">
                  <span className="text-slate-300 mt-0.5">•</span>
                  <span>
                    <span className="font-medium">{formatDateCO(h.fecha)}</span>
                    : <span className="text-slate-600">{h.estadoAnterior}</span>
                    <span className="text-slate-300 mx-1">→</span>
                    <span className="text-slate-600 font-medium">{h.estadoNuevo}</span>
                    <span className="text-slate-400 ml-1">({h.usuario})</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {event.observaciones && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Observaciones</p>
            <p className="text-sm text-slate-700 leading-relaxed">{event.observaciones}</p>
          </div>
        )}
      </div>

      <ItemManager
        items={items}
        aliados={mockAliados}
        eventTotals={eventTotals}
        readOnly
      />

    </div>
  )
}
