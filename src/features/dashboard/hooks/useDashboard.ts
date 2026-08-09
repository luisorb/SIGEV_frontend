import { useState, useMemo } from 'react'
import type { Event, Ally, Disbursement, Municipality, EventState } from '../../../types'
import type { DashboardFiltersState, DashboardMetrics, ConsolidadoRow, CoberturaItem, EventoIncompleto } from '../types'
import { getEventEconomics } from '../../../utils/eventEconomics'

const ESTADOS_EN_EJECUCION: EventState[] = ['En ejecución', 'Ejecutado', 'Cerrado', 'Legalizado']

function isEventoAprobadoOEnEjecucion(event: Event): boolean {
  if (event.cotizacionSeleccionadaId) return true
  return ESTADOS_EN_EJECUCION.includes(event.estado)
}

export function useDashboard(
  events: Event[],
  aliados: Ally[],
  desembolsos: Disbursement[],
  municipios: Municipality[]
) {
  const [filters, setFilters] = useState<DashboardFiltersState>({
    periodoInicio: '',
    periodoFin: '',
    desembolsoId: '',
    aliadoId: '',
    estado: '',
    municipioId: '',
    dependencia: '',
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

    return result
  }, [ejecucionEvents, filters])

  const metrics = useMemo<DashboardMetrics>(() => {
    let valorTotalEjecucion = 0
    let baseMasImpuestos = 0
    let feeAcumulado = 0
    let impuestosAcumulados = 0

    for (const event of filteredEvents) {
      const e = getEventEconomics(event)
      valorTotalEjecucion += e.total
      baseMasImpuestos += e.base + e.iva + e.impuestoConsumo
      feeAcumulado += e.feeTarifado + e.feeTerceros + e.ivaFee
      impuestosAcumulados += e.iva + e.impuestoConsumo + e.ivaFee
    }

    return {
      valorTotalEjecucion,
      numeroEventos: filteredEvents.length,
      baseMasImpuestos,
      feeAcumulado,
      impuestosAcumulados,
    }
  }, [filteredEvents])

  const consolidadoDesembolso = useMemo<ConsolidadoRow[]>(() => {
    const groups: Record<string, ConsolidadoRow> = {}

    for (const event of filteredEvents) {
      if (!groups[event.desembolsoId]) {
        groups[event.desembolsoId] = {
          id: event.desembolsoId,
          nombre: desembolsosMap[event.desembolsoId] || event.desembolsoId,
          cantidadEventos: 0,
          valorTotal: 0,
          feeTotal: 0,
          porcentaje: 0,
        }
      }
      groups[event.desembolsoId].cantidadEventos++
      const e = getEventEconomics(event)
      groups[event.desembolsoId].valorTotal += e.total
      groups[event.desembolsoId].feeTotal += e.feeTarifado + e.feeTerceros + e.ivaFee
    }

    const total = Object.values(groups).reduce((s, g) => s + g.valorTotal, 0)
    const rows = Object.values(groups)
    for (const row of rows) {
      row.porcentaje = total > 0 ? row.valorTotal / total : 0
    }
    rows.sort((a, b) => b.valorTotal - a.valorTotal)
    return rows
  }, [filteredEvents, desembolsosMap])

  const consolidadoAliado = useMemo<ConsolidadoRow[]>(() => {
    const groups: Record<string, ConsolidadoRow> = {}

    for (const event of filteredEvents) {
      if (!groups[event.aliadoId]) {
        groups[event.aliadoId] = {
          id: event.aliadoId,
          nombre: aliadosMap[event.aliadoId] || event.aliadoId,
          cantidadEventos: 0,
          valorTotal: 0,
          feeTotal: 0,
          porcentaje: 0,
        }
      }
      groups[event.aliadoId].cantidadEventos++
      const e = getEventEconomics(event)
      groups[event.aliadoId].valorTotal += e.total
      groups[event.aliadoId].feeTotal += e.feeTarifado + e.feeTerceros + e.ivaFee
    }

    const total = Object.values(groups).reduce((s, g) => s + g.valorTotal, 0)
    const rows = Object.values(groups)
    for (const row of rows) {
      row.porcentaje = total > 0 ? row.valorTotal / total : 0
    }
    rows.sort((a, b) => b.valorTotal - a.valorTotal)
    return rows
  }, [filteredEvents, aliadosMap])

  const coberturaTerritorial = useMemo<CoberturaItem[]>(() => {
    const groups: Record<string, { cantidadEventos: number; valorTotal: number }> = {}

    for (const event of filteredEvents) {
      if (!groups[event.municipioId]) {
        groups[event.municipioId] = { cantidadEventos: 0, valorTotal: 0 }
      }
      groups[event.municipioId].cantidadEventos++
      groups[event.municipioId].valorTotal += getEventEconomics(event).total
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
  }, [filteredEvents, municipiosMap])

  const eventosIncompletos = useMemo<EventoIncompleto[]>(() => {
    const result: EventoIncompleto[] = []
    for (const event of filteredEvents) {
      if (!event.aliadoId || !event.desembolsoId || event.items.length === 0) {
        const missing: string[] = []
        if (!event.aliadoId) missing.push('sin aliado')
        if (!event.desembolsoId) missing.push('sin desembolso')
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
    aliadosMap,
    desembolsosMap,
    municipiosMap,
    dependencias,
    totalRegistrados: events.length,
    totalEnEjecucion: ejecucionEvents.length,
  }
}
