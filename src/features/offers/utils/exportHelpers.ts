import type { Offer, OfferItem, OfferExportOptions } from '../types'
import type { Ally, CalculationParams, Municipality } from '../../../types'

export function esquemaLabel(scheme?: string): string {
  if (scheme === 'cotizacion') return 'Cotización'
  if (scheme === 'detalle') return 'Detalle'
  return '—'
}

export function taxRateLabel(item: Pick<OfferItem, 'categoriaTributaria'>, rates?: CalculationParams): string {
  if (item.categoriaTributaria === 'IVA') {
    return `${Math.round((rates?.ivaRate ?? 0) * 100)}%`
  }
  if (item.categoriaTributaria === 'Consumo') {
    return `${Math.round((rates?.impuestoConsumoRate ?? 0) * 100)}%`
  }
  return '—'
}

export function aliadoName(offer: Offer, aliadoId: string | undefined, aliados?: Ally[]): string {
  if (aliadoId) {
    const a = aliados?.find((x) => x.id === aliadoId)
    return a ? a.nombre : aliadoId
  }
  return offer.aliado || 'General'
}

export function clienteOferta(offer: Offer, aliados?: Ally[]): string {
  if (offer.aliadoId) {
    const a = aliados?.find((x) => x.id === offer.aliadoId)
    if (a?.contacto) return a.contacto
  }
  return offer.cliente
}

export function resolveMunicipio(municipioId: string | undefined, municipios?: Municipality[]) {
  if (!municipioId) return undefined
  return municipios?.find((m) => m.id === municipioId)
}

export function splitNumeroEvento(value: string): { numero: string; sufijo: string } {
  const idx = value.lastIndexOf('-')
  if (idx === -1) return { numero: value, sufijo: '' }
  return { numero: value.slice(0, idx), sufijo: value.slice(idx + 1) }
}

export function displayItemsForExport(offer: Offer, options: OfferExportOptions) {
  const items = options.event?.items?.length ? options.event.items : offer.items
  const totals = items.reduce(
    (acc, item) => ({
      base: acc.base + item.base,
      iva: acc.iva + item.iva,
      consumo: acc.consumo + item.impuestoConsumo,
      fee: acc.fee + item.feeTarifado + item.feeTerceros,
      ivaFee: acc.ivaFee + item.ivaFee,
      total: acc.total + item.total,
    }),
    { base: 0, iva: 0, consumo: 0, fee: 0, ivaFee: 0, total: 0 },
  )
  return { items, totals }
}
