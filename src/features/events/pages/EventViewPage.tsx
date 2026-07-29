import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Pencil } from 'lucide-react'
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
      <div className="text-center py-12">
        <p className="text-slate-500">Evento no encontrado</p>
        <Link to="/ordenes" className="text-primary hover:text-primary-dark text-sm mt-2 inline-block">
          Volver a órdenes
        </Link>
      </div>
    )
  }

  const aliadoName = mockAliados.find((a) => a.id === event.aliadoId)?.nombre
  const municipioName = mockMunicipios.find((m) => m.id === event.municipioId)
  const desembolsoName = mockDesembolsos.find((d) => d.id === event.desembolsoId)?.nombre

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/ordenes"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver a órdenes
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Orden {event.numeroEvento}</h1>
          <p className="text-sm text-slate-500">
            {aliadoName ?? ''} · {municipioName?.nombre ?? ''} · {event.items.length} ítems
          </p>
        </div>
        <Link
          to={`/ordenes/${event.id}/editar`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Responsable</p>
          <p className="text-sm font-medium text-slate-900">{event.responsable}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Dependencia</p>
          <p className="text-sm font-medium text-slate-900">{event.dependencia || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha Evento</p>
          <p className="text-sm font-medium text-slate-900">{event.fechaEvento ? formatDateCO(event.fechaEvento) : '-'}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Asistentes / Días</p>
          <p className="text-sm font-medium text-slate-900">{event.asistentes} asistentes · {event.dias} días</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Ubicación</p>
          <p className="text-sm font-medium text-slate-900">
            {municipioName?.nombre ?? event.municipioId}
            {municipioName?.departamento ? ` (${municipioName.departamento})` : ''}
            {event.vereda ? ` · ${event.vereda}` : ''}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Coordenadas</p>
          <p className="text-sm font-medium text-slate-900">
            {event.latitud && event.longitud ? `${event.latitud}, ${event.longitud}` : 'No registradas'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Esquema</p>
          <p className="text-sm font-medium text-slate-900 capitalize">{event.esquema}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Desembolso</p>
          <p className="text-sm font-medium text-slate-900">{desembolsoName ?? event.desembolsoId}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Estado</p>
          <div className="flex items-center gap-2">
            <select
              value={currentEstado || event.estado}
              onChange={(e) => handleStateChange(e.target.value)}
              className="text-sm font-medium border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary"
            >
              {EVENT_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {stateHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-primary hover:text-primary-dark underline shrink-0"
              >
                {showHistory ? 'Ocultar historial' : 'Ver historial'}
              </button>
            )}
          </div>
          {showHistory && stateHistory.length > 0 && (
            <div className="mt-2 space-y-1">
              {stateHistory.map((h) => (
                <p key={h.id} className="text-[11px] text-slate-500">
                  {formatDateCO(h.fecha)}: {h.estadoAnterior} → {h.estadoNuevo} ({h.usuario})
                </p>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total</p>
          <p className="text-sm font-bold text-slate-900">{formatCurrencyCO(eventTotals.granTotal)}</p>
        </div>
      </div>

      {event.observaciones && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observaciones</p>
          <p className="text-sm text-slate-700">{event.observaciones}</p>
        </div>
      )}

      <ItemManager
        items={items}
        aliados={mockAliados}
        eventTotals={eventTotals}
        readOnly
      />
    </div>
  )
}
