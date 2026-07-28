import type { ItemInput, CalculationParams, ItemTotals, EventTotals, CalculationSummary } from '../types'
import { DEFAULT_CALCULATION_PARAMS } from '../config/constants'

function calculateItemTotals(item: ItemInput, params: CalculationParams = DEFAULT_CALCULATION_PARAMS): ItemTotals {
  const base = item.cantidad * item.valorUnitario

  const iva = item.categoriaTributaria === 'IVA' ? base * params.ivaRate : 0
  const impuestoConsumo = item.categoriaTributaria === 'Consumo' ? base * params.impuestoConsumoRate : 0
  const impuestos = iva + impuestoConsumo

  const baseForFee = params.applyFeeOnBase ? base : base + impuestos

  const feeTarifado = item.categoriaTributaria === 'IVA' || item.categoriaTributaria === 'Consumo'
    ? baseForFee * params.feeTarifadoRate
    : 0

  const feeTerceros = item.categoriaTributaria === 'Tercero' || item.categoriaTributaria === 'Reembolso'
    ? baseForFee * params.feeTercerosRate
    : 0

  const feeTotal = feeTarifado + feeTerceros
  const ivaFee = feeTotal * params.ivaFeeRate

  const totalSinRetenciones = base + impuestos
  const total = totalSinRetenciones + feeTotal + ivaFee

  return {
    base,
    iva,
    impuestoConsumo,
    impuestos,
    feeTarifado,
    feeTerceros,
    feeTotal,
    ivaFee,
    totalSinRetenciones,
    total,
  }
}

export function calculateEventSummary(
  items: ItemInput[],
  params: CalculationParams = DEFAULT_CALCULATION_PARAMS,
): CalculationSummary {
  const itemTotals = items.map((item) => calculateItemTotals(item, params))

  const eventTotals: EventTotals = {
    baseTotal: itemTotals.reduce((sum, t) => sum + t.base, 0),
    ivaTotal: itemTotals.reduce((sum, t) => sum + t.iva, 0),
    impuestoConsumoTotal: itemTotals.reduce((sum, t) => sum + t.impuestoConsumo, 0),
    impuestosTotal: itemTotals.reduce((sum, t) => sum + t.impuestos, 0),
    feeTarifadoTotal: itemTotals.reduce((sum, t) => sum + t.feeTarifado, 0),
    feeTercerosTotal: itemTotals.reduce((sum, t) => sum + t.feeTerceros, 0),
    feeTotal: itemTotals.reduce((sum, t) => sum + t.feeTotal, 0),
    ivaFeeTotal: itemTotals.reduce((sum, t) => sum + t.ivaFee, 0),
    totalSinRetenciones: itemTotals.reduce((sum, t) => sum + t.totalSinRetenciones, 0),
    granTotal: itemTotals.reduce((sum, t) => sum + t.total, 0),
    cantidadItems: items.length,
  }

  return { itemTotals, eventTotals }
}

export function calculateItemPreview(
  item: ItemInput,
  params: CalculationParams = DEFAULT_CALCULATION_PARAMS,
): ItemTotals {
  return calculateItemTotals(item, params)
}
