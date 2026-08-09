import type { Event } from '../types'

export interface EventEconomics {
  base: number
  iva: number
  impuestoConsumo: number
  feeTarifado: number
  feeTerceros: number
  ivaFee: number
  total: number
}

export function getEventEconomics(event: Event): EventEconomics {
  const o = event.ofertaEconomica
  if (o) {
    return {
      base: o.baseTotal,
      iva: o.ivaTotal,
      impuestoConsumo: o.impuestoConsumoTotal,
      feeTarifado: o.feeTarifadoTotal,
      feeTerceros: o.feeTercerosTotal,
      ivaFee: o.ivaFeeTotal,
      total: o.total,
    }
  }
  let base = 0
  let iva = 0
  let impuestoConsumo = 0
  let feeTarifado = 0
  let feeTerceros = 0
  let ivaFee = 0
  let total = 0
  for (const i of event.items) {
    base += i.base
    iva += i.iva
    impuestoConsumo += i.impuestoConsumo
    feeTarifado += i.feeTarifado
    feeTerceros += i.feeTerceros
    ivaFee += i.ivaFee
    total += i.total
  }
  return { base, iva, impuestoConsumo, feeTarifado, feeTerceros, ivaFee, total }
}
