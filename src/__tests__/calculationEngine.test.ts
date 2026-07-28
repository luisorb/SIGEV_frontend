import { describe, it, expect } from 'vitest'
import { calculateEventSummary, calculateItemPreview } from '../utils/calculationEngine'
import type { ItemInput, CalculationParams } from '../types'

const defaultParams: CalculationParams = {
  ivaRate: 0.19,
  impuestoConsumoRate: 0.08,
  feeTarifadoRate: 0.05,
  feeTercerosRate: 0.10,
  ivaFeeRate: 0.19,
  applyFeeOnBase: true,
}

describe('calculateItemPreview', () => {
  it('calcula un item con IVA correctamente', () => {
    const item: ItemInput = {
      descripcion: 'Servicio técnico',
      cantidad: 10,
      valorUnitario: 100000,
      categoriaTributaria: 'IVA',
    }

    const result = calculateItemPreview(item, defaultParams)

    expect(result.base).toBe(1_000_000)
    expect(result.iva).toBe(190_000)
    expect(result.impuestoConsumo).toBe(0)
    expect(result.impuestos).toBe(190_000)
    expect(result.feeTarifado).toBe(50_000)
    expect(result.feeTerceros).toBe(0)
    expect(result.feeTotal).toBe(50_000)
    expect(result.ivaFee).toBe(9_500)
    expect(result.totalSinRetenciones).toBe(1_190_000)
    expect(result.total).toBe(1_249_500)
  })

  it('calcula un item con Impuesto al Consumo correctamente', () => {
    const item: ItemInput = {
      descripcion: 'Producto consumo',
      cantidad: 5,
      valorUnitario: 200000,
      categoriaTributaria: 'Consumo',
    }

    const result = calculateItemPreview(item, defaultParams)

    expect(result.base).toBe(1_000_000)
    expect(result.iva).toBe(0)
    expect(result.impuestoConsumo).toBe(80_000)
    expect(result.impuestos).toBe(80_000)
    expect(result.feeTarifado).toBe(50_000)
    expect(result.feeTerceros).toBe(0)
    expect(result.feeTotal).toBe(50_000)
    expect(result.ivaFee).toBe(9_500)
    expect(result.totalSinRetenciones).toBe(1_080_000)
    expect(result.total).toBe(1_139_500)
  })

  it('calcula un item Tercero correctamente', () => {
    const item: ItemInput = {
      descripcion: 'Servicio tercero',
      cantidad: 3,
      valorUnitario: 500000,
      categoriaTributaria: 'Tercero',
    }

    const result = calculateItemPreview(item, defaultParams)

    expect(result.base).toBe(1_500_000)
    expect(result.iva).toBe(0)
    expect(result.impuestoConsumo).toBe(0)
    expect(result.impuestos).toBe(0)
    expect(result.feeTarifado).toBe(0)
    expect(result.feeTerceros).toBe(150_000)
    expect(result.feeTotal).toBe(150_000)
    expect(result.ivaFee).toBe(28_500)
    expect(result.totalSinRetenciones).toBe(1_500_000)
    expect(result.total).toBe(1_678_500)
  })

  it('calcula un item Reembolso correctamente', () => {
    const item: ItemInput = {
      descripcion: 'Reembolso gastos',
      cantidad: 1,
      valorUnitario: 2000000,
      categoriaTributaria: 'Reembolso',
    }

    const result = calculateItemPreview(item, defaultParams)

    expect(result.base).toBe(2_000_000)
    expect(result.iva).toBe(0)
    expect(result.impuestoConsumo).toBe(0)
    expect(result.impuestos).toBe(0)
    expect(result.feeTarifado).toBe(0)
    expect(result.feeTerceros).toBe(200_000)
    expect(result.feeTotal).toBe(200_000)
    expect(result.ivaFee).toBe(38_000)
    expect(result.totalSinRetenciones).toBe(2_000_000)
    expect(result.total).toBe(2_238_000)
  })

  it('usa base + impuestos para fee cuando applyFeeOnBase es false', () => {
    const item: ItemInput = {
      descripcion: 'Servicio con IVA',
      cantidad: 10,
      valorUnitario: 100000,
      categoriaTributaria: 'IVA',
    }

    const params: CalculationParams = {
      ...defaultParams,
      applyFeeOnBase: false,
    }

    const result = calculateItemPreview(item, params)

    expect(result.base).toBe(1_000_000)
    expect(result.iva).toBe(190_000)
    expect(result.impuestos).toBe(190_000)
    expect(result.feeTarifado).toBe(59_500)
    expect(result.feeTotal).toBe(59_500)
    expect(result.ivaFee).toBe(11_305)
    expect(result.totalSinRetenciones).toBe(1_190_000)
    expect(result.total).toBe(1_260_805)
  })

  it('maneja cantidad 0 correctamente', () => {
    const item: ItemInput = {
      descripcion: 'Item sin cantidad',
      cantidad: 0,
      valorUnitario: 100000,
      categoriaTributaria: 'IVA',
    }

    const result = calculateItemPreview(item, defaultParams)

    expect(result.base).toBe(0)
    expect(result.iva).toBe(0)
    expect(result.feeTarifado).toBe(0)
    expect(result.feeTotal).toBe(0)
    expect(result.ivaFee).toBe(0)
    expect(result.total).toBe(0)
  })

  it('maneja valor unitario 0 correctamente', () => {
    const item: ItemInput = {
      descripcion: 'Item sin costo',
      cantidad: 5,
      valorUnitario: 0,
      categoriaTributaria: 'IVA',
    }

    const result = calculateItemPreview(item, defaultParams)

    expect(result.base).toBe(0)
    expect(result.iva).toBe(0)
    expect(result.total).toBe(0)
  })

  it('usa parámetros personalizados correctamente', () => {
    const item: ItemInput = {
      descripcion: 'Servicio tasas personalizadas',
      cantidad: 10,
      valorUnitario: 100000,
      categoriaTributaria: 'IVA',
    }

    const customParams: CalculationParams = {
      ivaRate: 0.10,
      impuestoConsumoRate: 0.05,
      feeTarifadoRate: 0.03,
      feeTercerosRate: 0.08,
      ivaFeeRate: 0.10,
      applyFeeOnBase: true,
    }

    const result = calculateItemPreview(item, customParams)

    expect(result.base).toBe(1_000_000)
    expect(result.iva).toBe(100_000)
    expect(result.feeTarifado).toBe(30_000)
    expect(result.ivaFee).toBe(3_000)
    expect(result.total).toBe(1_133_000)
  })
})

describe('calculateEventSummary', () => {
  it('calcula el resumen de múltiples items correctamente', () => {
    const items: ItemInput[] = [
      {
        descripcion: 'Servicio IVA',
        cantidad: 10,
        valorUnitario: 100000,
        categoriaTributaria: 'IVA',
      },
      {
        descripcion: 'Servicio Consumo',
        cantidad: 5,
        valorUnitario: 200000,
        categoriaTributaria: 'Consumo',
      },
      {
        descripcion: 'Servicio Tercero',
        cantidad: 3,
        valorUnitario: 500000,
        categoriaTributaria: 'Tercero',
      },
    ]

    const result = calculateEventSummary(items, defaultParams)

    expect(result.itemTotals).toHaveLength(3)
    expect(result.eventTotals.cantidadItems).toBe(3)

    expect(result.eventTotals.baseTotal).toBe(3_500_000)
    expect(result.eventTotals.ivaTotal).toBe(190_000)
    expect(result.eventTotals.impuestoConsumoTotal).toBe(80_000)
    expect(result.eventTotals.impuestosTotal).toBe(270_000)

    expect(result.eventTotals.feeTarifadoTotal).toBe(100_000)
    expect(result.eventTotals.feeTercerosTotal).toBe(150_000)
    expect(result.eventTotals.feeTotal).toBe(250_000)
    expect(result.eventTotals.ivaFeeTotal).toBe(47_500)

    expect(result.eventTotals.totalSinRetenciones).toBe(3_770_000)
    expect(result.eventTotals.granTotal).toBe(4_067_500)
  })

  it('retorna totales en 0 para lista vacía', () => {
    const result = calculateEventSummary([])

    expect(result.itemTotals).toHaveLength(0)
    expect(result.eventTotals.baseTotal).toBe(0)
    expect(result.eventTotals.ivaTotal).toBe(0)
    expect(result.eventTotals.impuestoConsumoTotal).toBe(0)
    expect(result.eventTotals.impuestosTotal).toBe(0)
    expect(result.eventTotals.feeTarifadoTotal).toBe(0)
    expect(result.eventTotals.feeTercerosTotal).toBe(0)
    expect(result.eventTotals.feeTotal).toBe(0)
    expect(result.eventTotals.ivaFeeTotal).toBe(0)
    expect(result.eventTotals.totalSinRetenciones).toBe(0)
    expect(result.eventTotals.granTotal).toBe(0)
    expect(result.eventTotals.cantidadItems).toBe(0)
  })

  it('maneja un solo item correctamente', () => {
    const items: ItemInput[] = [
      {
        descripcion: 'Único servicio',
        cantidad: 1,
        valorUnitario: 1000000,
        categoriaTributaria: 'IVA',
      },
    ]

    const result = calculateEventSummary(items, defaultParams)

    expect(result.eventTotals.cantidadItems).toBe(1)
    expect(result.eventTotals.baseTotal).toBe(1_000_000)
    expect(result.eventTotals.granTotal).toBe(1_249_500)
    expect(result.itemTotals[0].total).toBe(1_249_500)
  })

  it('mezcla items de distintas categorías tributarias', () => {
    const items: ItemInput[] = [
      { descripcion: 'A', cantidad: 10, valorUnitario: 10000, categoriaTributaria: 'IVA' },
      { descripcion: 'B', cantidad: 10, valorUnitario: 10000, categoriaTributaria: 'Consumo' },
      { descripcion: 'C', cantidad: 10, valorUnitario: 10000, categoriaTributaria: 'Tercero' },
      { descripcion: 'D', cantidad: 10, valorUnitario: 10000, categoriaTributaria: 'Reembolso' },
    ]

    const result = calculateEventSummary(items, defaultParams)

    expect(result.eventTotals.baseTotal).toBe(400_000)
    expect(result.eventTotals.ivaTotal).toBe(19_000)
    expect(result.eventTotals.impuestoConsumoTotal).toBe(8_000)
    expect(result.eventTotals.impuestosTotal).toBe(27_000)

    expect(result.itemTotals[0].feeTarifado).toBeGreaterThan(0)
    expect(result.itemTotals[1].feeTarifado).toBeGreaterThan(0)
    expect(result.itemTotals[2].feeTarifado).toBe(0)
    expect(result.itemTotals[3].feeTarifado).toBe(0)

    expect(result.itemTotals[2].feeTerceros).toBeGreaterThan(0)
    expect(result.itemTotals[3].feeTerceros).toBeGreaterThan(0)
    expect(result.itemTotals[0].feeTerceros).toBe(0)
    expect(result.itemTotals[1].feeTerceros).toBe(0)
  })
})
