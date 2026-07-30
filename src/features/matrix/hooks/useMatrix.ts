import { useMemo, useState } from 'react'
import type { Event, Ally, Disbursement, Municipality } from '../../../types'
import type { MatrixView, DetailedRow, MatrixRow, MatrixTotals, MatrixSummary, MatrixFilters } from '../types'

function getEffectiveAliadoId(item: { aliadoId?: string }, event: { aliadoId: string }): string {
  return item.aliadoId ?? event.aliadoId
}

export function useMatrix(
  events: Event[],
  aliados: Ally[],
  desembolsos: Disbursement[],
  municipios: Municipality[],
) {
  const [view, setView] = useState<MatrixView>('detallada')
  const [filters, setFilters] = useState<MatrixFilters>({
    periodoDesde: '',
    periodoHasta: '',
    municipioId: '',
    estado: '',
    desembolsoId: '',
    aliadoId: '',
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
    const m: Record<string, string> = {}
    for (const mun of municipios) m[mun.id] = mun.nombre
    return m
  }, [municipios])

  const aliadoIds = useMemo(() => aliados.map((a) => a.id), [aliados])
  const desembolsoIds = useMemo(() => desembolsos.map((d) => d.id), [desembolsos])

  const filteredEvents = useMemo(() => {
    let result = events
    if (filters.periodoDesde) {
      result = result.filter((e) => e.fechaEvento >= filters.periodoDesde)
    }
    if (filters.periodoHasta) {
      result = result.filter((e) => e.fechaEvento <= filters.periodoHasta)
    }
    if (filters.municipioId) {
      result = result.filter((e) => e.municipioId === filters.municipioId)
    }
    if (filters.estado) {
      result = result.filter((e) => e.estado === filters.estado)
    }
    if (filters.desembolsoId) {
      result = result.filter((e) => e.desembolsoId === filters.desembolsoId)
    }
    if (filters.aliadoId) {
      result = result.filter((e) => e.aliadoId === filters.aliadoId)
    }
    return result
  }, [events, filters])

  const detailedRows = useMemo<DetailedRow[]>(() => {
    const rows: DetailedRow[] = []
    for (const event of filteredEvents) {
      for (const item of event.items) {
        const effectiveAliadoId = getEffectiveAliadoId(item, event)
        rows.push({
          eventoId: event.id,
          numeroEvento: event.numeroEvento + (event.sufijo ? `-${event.sufijo}` : ''),
          fechaEvento: event.fechaEvento,
          municipio: municipiosMap[event.municipioId] || event.municipioId,
          estado: event.estado,
          itemId: item.id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          valorUnitario: item.valorUnitario,
          categoriaTributaria: item.categoriaTributaria,
          base: item.base,
          iva: item.iva,
          impuestoConsumo: item.impuestoConsumo,
          feeTarifado: item.feeTarifado,
          feeTerceros: item.feeTerceros,
          ivaFee: item.ivaFee,
          total: item.total,
          aliadoId: effectiveAliadoId,
          aliadoNombre: aliadosMap[effectiveAliadoId] || effectiveAliadoId,
          desembolsoId: event.desembolsoId,
          desembolsoNombre: desembolsosMap[event.desembolsoId] || event.desembolsoId,
        })
      }
    }
    return rows
  }, [filteredEvents, aliadosMap, desembolsosMap, municipiosMap])

  const globalRows = useMemo<MatrixRow[]>(() => {
    const groups: Record<string, Record<string, { eventos: Set<string>; valor: number; fee: number }>> = {}

    for (const event of filteredEvents) {
      for (const item of event.items) {
        const dId = event.desembolsoId
        const aId = getEffectiveAliadoId(item, event)
        if (!groups[dId]) groups[dId] = {}
        if (!groups[dId][aId]) {
          groups[dId][aId] = { eventos: new Set(), valor: 0, fee: 0 }
        }
        groups[dId][aId].eventos.add(event.id)
        groups[dId][aId].valor += item.total
        groups[dId][aId].fee += item.feeTarifado + item.feeTerceros + item.ivaFee
      }
    }

    return desembolsoIds.map((dId) => {
      const cells: MatrixRow['cells'] = {}
      let totalEventos = 0
      let totalValor = 0
      let totalFee = 0
      for (const aId of aliadoIds) {
        const cell = groups[dId]?.[aId]
        if (cell && cell.eventos.size > 0) {
          cells[aId] = {
            desembolsoId: dId,
            desembolsoNombre: desembolsosMap[dId] || dId,
            aliadoId: aId,
            aliadoNombre: aliadosMap[aId] || aId,
            cantidadEventos: cell.eventos.size,
            valorTotal: cell.valor,
            feeTotal: cell.fee,
          }
          totalEventos += cell.eventos.size
          totalValor += cell.valor
          totalFee += cell.fee
        }
      }
      return {
        desembolsoId: dId,
        desembolsoNombre: desembolsosMap[dId] || dId,
        cells,
        totalEventos,
        totalValor,
        totalFee,
      }
    }).filter((r) => r.totalEventos > 0)
  }, [filteredEvents, aliadoIds, desembolsoIds, aliadosMap, desembolsosMap])

  const totals = useMemo<MatrixTotals>(() => {
    let totalEventos = 0
    let totalValor = 0
    let totalBase = 0
    let totalIva = 0
    let totalConsumo = 0
    let totalFeeTarifado = 0
    let totalFeeTerceros = 0
    let totalIvaFee = 0
    for (const r of detailedRows) {
      totalEventos++
      totalValor += r.total
      totalBase += r.base
      totalIva += r.iva
      totalConsumo += r.impuestoConsumo
      totalFeeTarifado += r.feeTarifado
      totalFeeTerceros += r.feeTerceros
      totalIvaFee += r.ivaFee
    }
    const uniqueEvents = new Set(detailedRows.map((r) => r.eventoId))
    return {
      totalEventos: uniqueEvents.size,
      totalValor,
      totalFee: totalFeeTarifado + totalFeeTerceros + totalIvaFee,
      totalBase,
      totalIva,
      totalConsumo,
      totalFeeTarifado,
      totalFeeTerceros,
      totalIvaFee,
    }
  }, [detailedRows])

  const summary = useMemo<MatrixSummary>(() => {
    let totalItems = 0
    let totalBase = 0
    let totalImpuestos = 0
    let totalFee = 0
    let totalIvaFee = 0
    let totalGeneral = 0
    for (const r of detailedRows) {
      totalItems++
      totalBase += r.base
      totalImpuestos += r.iva + r.impuestoConsumo
      totalFee += r.feeTarifado + r.feeTerceros
      totalIvaFee += r.ivaFee
      totalGeneral += r.total
    }
    const uniqueEvents = new Set(detailedRows.map((r) => r.eventoId))
    return {
      totalEventos: uniqueEvents.size,
      totalItems,
      totalBase,
      totalImpuestos,
      totalFee,
      totalIvaFee,
      totalGeneral,
    }
  }, [detailedRows])

  const updateFilter = (key: keyof MatrixFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      periodoDesde: '',
      periodoHasta: '',
      municipioId: '',
      estado: '',
      desembolsoId: '',
      aliadoId: '',
    })
  }

  const hasFilters = Object.values(filters).some((v) => v !== '')

  return {
    view,
    setView,
    filters,
    updateFilter,
    clearFilters,
    hasFilters,
    detailedRows,
    globalRows,
    totals,
    summary,
    aliadoIds,
    desembolsoIds,
    aliadosMap,
    desembolsosMap,
    municipiosMap,
  }
}
