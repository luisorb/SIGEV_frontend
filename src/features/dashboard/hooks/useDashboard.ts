import { useState, useMemo } from 'react'
import type { Event, Ally, Disbursement, Municipality, EventState } from '../../../types'
import type { PaymentResponse } from '../../../services/payments.service'
import type { DashboardFiltersState, DashboardMetrics, ConsolidadoRow, CoberturaItem, EventoIncompleto, EstadoRow, TendenciaMes } from '../types'
import { EVENT_STATES } from '../../../config/constants'

const ESTADOS_EN_EJECUCION: EventState[] = ['En ejecución', 'Ejecutado', 'Cerrado', 'Legalizado']

function isEventoAprobadoOEnEjecucion(event: Event): boolean {
  if (event.cotizacionSeleccionadaId) return true
  return ESTADOS_EN_EJECUCION.includes(event.estado)
}

export function isPagoValido(payment: PaymentResponse): boolean {
  return payment.status !== 'Anulado'
}

export function buildPagadoPorEvento(payments: PaymentResponse[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const payment of payments) {
    if (!isPagoValido(payment)) continue
    map.set(payment.eventId, (map.get(payment.eventId) ?? 0) + Number(payment.amount))
  }
  return map
}

export function useDashboard(
  events: Event[],
  aliados: Ally[],
  desembolsos: Disbursement[],
  municipios: Municipality[],
  pagos: PaymentResponse[] = [],
) {
  const [filters, setFilters] = useState<DashboardFiltersState>({
    periodoInicio: '',
    periodoFin: '',
    desembolsoId: '',
    aliadoId: '',
    estado: '',
    municipioId: '',
    dependencia: '',
    programa: '',
    instanciaParticipacion: '',
  })

  const aliadosMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const a of aliados) m[a.id] = a.nombre
    return m
  }, [aliados])

  const desembolsosMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const d of desembolsos) m[d.id] = d.nombre
    return m
  }, [desembolsos])

  const municipiosMap = useMemo(() => {
    const m: Record<string, Municipality> = {}
    for (const mun of municipios) m[mun.id] = mun
    return m
  }, [municipios])

  const dependencias = useMemo(() => {
    const set = new Set<string>()
    for (const e of events) {
      if (e.dependencia) set.add(e.dependencia)
    }
    return Array.from(set).sort()
  }, [events])

  const ejecucionEvents = useMemo(
    () => events.filter(isEventoAprobadoOEnEjecucion),
    [events],
  )

  const filteredEvents = useMemo(() => {
    let result = [...ejecucionEvents]

    if (filters.desembolsoId) {
      result = result.filter((e) => e.desembolsoId === filters.desembolsoId)
    }
    if (filters.aliadoId) {
      result = result.filter((e) => e.aliadoId === filters.aliadoId)
    }
    if (filters.estado) {
      result = result.filter((e) => e.estado === filters.estado)
    }
    if (filters.periodoInicio) {
      result = result.filter((e) => e.fechaEvento >= filters.periodoInicio)
    }
    if (filters.periodoFin) {
      result = result.filter((e) => e.fechaEvento <= filters.periodoFin)
    }
    if (filters.municipioId) {
      result = result.filter((e) => e.municipioId === filters.municipioId)
    }
    if (filters.dependencia) {
      result = result.filter((e) => e.dependencia === filters.dependencia)
    }
    if (filters.programa) {
      result = result.filter((e) => e.programa === filters.programa)
    }
    if (filters.instanciaParticipacion) {
      result = result.filter((e) => e.instanciaParticipacion === filters.instanciaParticipacion)
    }

    return result
  }, [ejecucionEvents, filters])

  const filteredEventIds = useMemo(() => new Set(filteredEvents.map((e) => e.id)), [filteredEvents])

  const pagosFiltrados = useMemo(
    () => pagos.filter((p) => isPagoValido(p) && filteredEventIds.has(p.eventId)),
    [pagos, filteredEventIds],
  )

  const pagadoPorEvento = useMemo(() => buildPagadoPorEvento(pagos), [pagos])

  const metrics = useMemo<DashboardMetrics>(() => {
    let valorTotalEjecutado = 0

    for (const pago of pagosFiltrados) {
      valorTotalEjecutado += Number(pago.amount)
    }

    return {
      valorTotalEjecutado,
      numeroPagos: pagosFiltrados.length,
    }
  }, [pagosFiltrados])

  const consolidadoDesembolso = useMemo<ConsolidadoRow[]>(() => {
    const groups: Record<string, ConsolidadoRow> = {}

    for (const event of filteredEvents) {
      if (!groups[event.desembolsoId]) {
        groups[event.desembolsoId] = {
          id: event.desembolsoId,
          nombre: desembolsosMap[event.desembolsoId] || event.desembolsoId,
          cantidadEventos: 0,
          valorTotal: 0,
          porcentaje: 0,
        }
      }
      groups[event.desembolsoId].cantidadEventos++
      groups[event.desembolsoId].valorTotal += pagadoPorEvento.get(event.id) ?? 0
    }

    const total = Object.values(groups).reduce((s, g) => s + g.valorTotal, 0)
    const rows = Object.values(groups)
    for (const row of rows) {
      row.porcentaje = total > 0 ? row.valorTotal / total : 0
    }
    rows.sort((a, b) => b.valorTotal - a.valorTotal)
    return rows
  }, [filteredEvents, desembolsosMap, pagadoPorEvento])

  const consolidadoAliado = useMemo<ConsolidadoRow[]>(() => {
    const groups: Record<string, ConsolidadoRow> = {}

    for (const event of filteredEvents) {
      if (!groups[event.aliadoId]) {
        groups[event.aliadoId] = {
          id: event.aliadoId,
          nombre: aliadosMap[event.aliadoId] || event.aliadoId,
          cantidadEventos: 0,
          valorTotal: 0,
          porcentaje: 0,
        }
      }
      groups[event.aliadoId].cantidadEventos++
      groups[event.aliadoId].valorTotal += pagadoPorEvento.get(event.id) ?? 0
    }

    const total = Object.values(groups).reduce((s, g) => s + g.valorTotal, 0)
    const rows = Object.values(groups)
    for (const row of rows) {
      row.porcentaje = total > 0 ? row.valorTotal / total : 0
    }
    rows.sort((a, b) => b.valorTotal - a.valorTotal)
    return rows
  }, [filteredEvents, aliadosMap, pagadoPorEvento])

  const coberturaTerritorial = useMemo<CoberturaItem[]>(() => {
    const groups: Record<string, { cantidadEventos: number; valorTotal: number }> = {}

    for (const event of filteredEvents) {
      if (!groups[event.municipioId]) {
        groups[event.municipioId] = { cantidadEventos: 0, valorTotal: 0 }
      }
      groups[event.municipioId].cantidadEventos++
      groups[event.municipioId].valorTotal += pagadoPorEvento.get(event.id) ?? 0
    }

    const totalValor = Object.values(groups).reduce((s, g) => s + g.valorTotal, 0)
    const rows: CoberturaItem[] = Object.entries(groups).map(([municipioId, g]) => {
      const mun = municipiosMap[municipioId]
      return {
        municipioId,
        municipio: mun?.nombre ?? municipioId,
        departamento: mun?.departamento ?? '',
        cantidadEventos: g.cantidadEventos,
        valorTotal: g.valorTotal,
        porcentaje: totalValor > 0 ? g.valorTotal / totalValor : 0,
      }
    })
    rows.sort((a, b) => b.valorTotal - a.valorTotal)
    return rows
  }, [filteredEvents, municipiosMap, pagadoPorEvento])

  const eventosIncompletos = useMemo<EventoIncompleto[]>(() => {
    const result: EventoIncompleto[] = []
    for (const event of filteredEvents) {
      if (!event.aliadoId || !event.desembolsoId || event.items.length === 0) {
        const missing: string[] = []
        if (!event.aliadoId) missing.push('sin aliado')
        if (!event.desembolsoId) missing.push('sin recurso disponible')
        if (event.items.length === 0) missing.push('sin ítems')
        result.push({
          id: event.id,
          numeroEvento: event.numeroEvento,
          sufijo: event.sufijo,
          responsable: event.responsable,
          motivo: missing.join(', '),
        })
      }
    }
    return result
  }, [filteredEvents])

  const seguimientoPorEstado = useMemo<EstadoRow[]>(() => {
    const groups: Record<string, EstadoRow> = {}

    for (const event of filteredEvents) {
      if (!groups[event.estado]) {
        groups[event.estado] = {
          estado: event.estado,
          cantidadEventos: 0,
          valorTotal: 0,
        }
      }
      groups[event.estado].cantidadEventos++
      groups[event.estado].valorTotal += pagadoPorEvento.get(event.id) ?? 0
    }

    const rows = EVENT_STATES.map((estado) => groups[estado] ?? {
      estado,
      cantidadEventos: 0,
      valorTotal: 0,
    })
    return rows
  }, [filteredEvents, pagadoPorEvento])

  const tendenciaMensual = useMemo<TendenciaMes[]>(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    const groups = new Map<number, { cantidadEventos: number; valorTotal: number }>()

    for (const event of filteredEvents) {
      const dateStr = event.fechaEvento || event.createdAt?.slice(0, 10) || ''
      if (!dateStr) continue
      const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr)
      if (Number.isNaN(d.getTime())) continue
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) continue

      const day = d.getDate()
      const current = groups.get(day) ?? { cantidadEventos: 0, valorTotal: 0 }
      current.cantidadEventos++
      current.valorTotal += pagadoPorEvento.get(event.id) ?? 0
      groups.set(day, current)
    }

    const result: TendenciaMes[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      const g = groups.get(day)
      const key = String(day)
      const mes = `${day}`
      const label = `${day} de ${now.toLocaleDateString('es-CO', { month: 'long' })}`
      result.push({
        key,
        mes,
        label,
        cantidadEventos: g?.cantidadEventos ?? 0,
        valorTotal: g?.valorTotal ?? 0,
      })
    }
    return result
  }, [filteredEvents, pagadoPorEvento])

  function updateFilter(key: keyof DashboardFiltersState, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters({
      periodoInicio: '',
      periodoFin: '',
      desembolsoId: '',
      aliadoId: '',
      estado: '',
      municipioId: '',
      dependencia: '',
      programa: '',
      instanciaParticipacion: '',
    })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    metrics,
    filteredEvents,
    consolidadoDesembolso,
    consolidadoAliado,
    coberturaTerritorial,
    eventosIncompletos,
    seguimientoPorEstado,
    tendenciaMensual,
    aliadosMap,
    desembolsosMap,
    municipiosMap,
    dependencias,
    totalRegistrados: events.length,
    totalEnEjecucion: ejecucionEvents.length,
  }
}
