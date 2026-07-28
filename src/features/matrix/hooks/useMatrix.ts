import { useMemo, useState } from 'react'
import type { Event, Ally, Disbursement } from '../../../types'
import type { MatrixRow, MatrixTotals } from '../types'

export function useMatrix(events: Event[], aliados: Ally[], desembolsos: Disbursement[]) {
  const [selectedDesembolso, setSelectedDesembolso] = useState('')
  const [selectedAliado, setSelectedAliado] = useState('')

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

  const aliadoIds = useMemo(() => aliados.map((a) => a.id), [aliados])
  const desembolsoIds = useMemo(() => desembolsos.map((d) => d.id), [desembolsos])

  const filteredEvents = useMemo(() => {
    let result = events
    if (selectedDesembolso) {
      result = result.filter((e) => e.desembolsoId === selectedDesembolso)
    }
    if (selectedAliado) {
      result = result.filter((e) => e.aliadoId === selectedAliado)
    }
    return result
  }, [events, selectedDesembolso, selectedAliado])

  const rows = useMemo<MatrixRow[]>(() => {
    const groups: Record<string, Record<string, { eventos: number; valor: number; fee: number }>> = {}

    for (const desId of desembolsoIds) {
      groups[desId] = {}
      for (const aliId of aliadoIds) {
        groups[desId][aliId] = { eventos: 0, valor: 0, fee: 0 }
      }
    }

    for (const event of filteredEvents) {
      const dId = event.desembolsoId
      const aId = event.aliadoId
      if (!groups[dId]) {
        groups[dId] = {}
      }
      if (!groups[dId][aId]) {
        groups[dId][aId] = { eventos: 0, valor: 0, fee: 0 }
      }
      groups[dId][aId].eventos++
      for (const item of event.items) {
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
        if (cell) {
          cells[aId] = {
            desembolsoId: dId,
            desembolsoNombre: desembolsosMap[dId] || dId,
            aliadoId: aId,
            aliadoNombre: aliadosMap[aId] || aId,
            cantidadEventos: cell.eventos,
            valorTotal: cell.valor,
            feeTotal: cell.fee,
          }
          totalEventos += cell.eventos
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
    let totalFee = 0
    for (const r of rows) {
      totalEventos += r.totalEventos
      totalValor += r.totalValor
      totalFee += r.totalFee
    }
    return { totalEventos, totalValor, totalFee }
  }, [rows])

  return {
    rows,
    totals,
    aliadoIds,
    desembolsoIds,
    aliadosMap,
    desembolsosMap,
    selectedDesembolso,
    selectedAliado,
    setSelectedDesembolso,
    setSelectedAliado,
  }
}
