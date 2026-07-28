import { useState, useMemo } from 'react'
import type { Event, Ally, Disbursement } from '../../../types'
import type { DashboardFiltersState, DashboardMetrics, ConsolidadoRow } from '../types'


export function useDashboard(events: Event[], aliados: Ally[], desembolsos: Disbursement[]) {
  const [filters, setFilters] = useState<DashboardFiltersState>({
    periodoInicio: '',
    periodoFin: '',
    desembolsoId: '',
    aliadoId: '',
    estado: '',
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

  const filteredEvents = useMemo(() => {
    let result = [...events]

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
      result = result.filter((e) => e.createdAt >= filters.periodoInicio)
    }
    if (filters.periodoFin) {
      result = result.filter((e) => e.createdAt <= filters.periodoFin)
    }

    return result
  }, [events, filters])

  const metrics = useMemo<DashboardMetrics>(() => {
    let valorTotalEjecucion = 0
    let baseMasImpuestos = 0
    let feeAcumulado = 0
    let impuestosAcumulados = 0

    for (const event of filteredEvents) {
      for (const item of event.items) {
        valorTotalEjecucion += item.total
        baseMasImpuestos += item.base + item.iva + item.impuestoConsumo
        feeAcumulado += item.feeTarifado + item.feeTerceros + item.ivaFee
        impuestosAcumulados += item.iva + item.impuestoConsumo + item.ivaFee
      }
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
      for (const item of event.items) {
        groups[event.desembolsoId].valorTotal += item.total
        groups[event.desembolsoId].feeTotal += item.feeTarifado + item.feeTerceros + item.ivaFee
      }
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
      for (const item of event.items) {
        groups[event.aliadoId].valorTotal += item.total
        groups[event.aliadoId].feeTotal += item.feeTarifado + item.feeTerceros + item.ivaFee
      }
    }

    const total = Object.values(groups).reduce((s, g) => s + g.valorTotal, 0)
    const rows = Object.values(groups)
    for (const row of rows) {
      row.porcentaje = total > 0 ? row.valorTotal / total : 0
    }
    rows.sort((a, b) => b.valorTotal - a.valorTotal)
    return rows
  }, [filteredEvents, aliadosMap])

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
    })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    metrics,
    consolidadoDesembolso,
    consolidadoAliado,
    aliadosMap,
    desembolsosMap,
  }
}
