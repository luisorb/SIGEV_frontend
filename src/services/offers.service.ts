import api from '../lib/api'
import type { Offer, OfferItem, OfferState } from '../features/offers/types'
import type { TaxCategory } from '../types'

export interface OfertaEconomicaItemResponse {
  id: string
  ofertaEconomicaId: string
  quotationItemId?: string | null
  description: string
  quantity: number
  unitPrice: number | string
  baseValue: number | string
  ivaRate: number | string
  ivaValue: number | string
  consumptionTaxRate: number | string
  consumptionTaxValue: number | string
  feeRate: number | string
  feeTarifadoValue: number | string
  feeTercerosValue: number | string
  feeIvaRate: number | string
  feeIvaValue: number | string
  totalValue: number | string
  allyId?: string | null
  tariffId?: string | null
  isTariffed: boolean
  createdAt: string
}

export interface OfertaEconomicaResponse {
  id: string
  code: string
  name: string
  eventId: string
  quotationId: string
  allyId?: string | null
  baseTotal: number | string
  ivaTotal: number | string
  impuestoConsumoTotal: number | string
  feeTarifadoTotal: number | string
  feeTercerosTotal: number | string
  feeTotal: number | string
  ivaFeeTotal: number | string
  total: number | string
  currency: string
  status: string
  generatedAt: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  event?: {
    id: string
    code: string
    suffix?: string | null
    name?: string | null
    status?: string | null
    startDate?: string | null
    municipalityName?: string | null
    municipalityCategory?: string | null
    disbursement?: { name: string } | null
  } | null
  quotation?: {
    id: string
    code: string
    name?: string | null
    cliente?: string | null
    ally?: { id: string; name: string } | null
  } | null
  ally?: { id: string; name: string } | null
  items?: OfertaEconomicaItemResponse[]
}

function mapOfertaEconomicaItem(data: OfertaEconomicaItemResponse): OfferItem {
  const ivaRate = Number(data.ivaRate ?? 0)
  const consumptionTaxRate = Number(data.consumptionTaxRate ?? 0)
  const categoriaTributaria: TaxCategory =
    ivaRate > 0 ? 'IVA' : consumptionTaxRate > 0 ? 'Consumo' : 'Tercero'
  return {
    id: data.id,
    ofertaId: data.ofertaEconomicaId,
    descripcion: data.description,
    cantidad: Number(data.quantity ?? 0),
    valorUnitario: Number(data.unitPrice ?? 0),
    categoriaTributaria,
    aliadoId: data.allyId ? String(data.allyId) : undefined,
    tariffId: data.tariffId ? String(data.tariffId) : undefined,
    base: Number(data.baseValue ?? 0),
    iva: Number(data.ivaValue ?? 0),
    impuestoConsumo: Number(data.consumptionTaxValue ?? 0),
    feeTarifado: Number(data.feeTarifadoValue ?? 0),
    feeTerceros: Number(data.feeTercerosValue ?? 0),
    ivaFee: Number(data.feeIvaValue ?? 0),
    total: Number(data.totalValue ?? 0),
  }
}

export function mapOfertaEconomicaToOffer(data: OfertaEconomicaResponse): Offer {
  const items = Array.isArray(data.items) ? data.items.map(mapOfertaEconomicaItem) : []
  const event = data.event
  const numeroEvento = event ? `${event.code}${event.suffix ? `-${event.suffix}` : ''}` : ''
  return {
    id: data.id,
    codigo: data.code,
    nombre: data.name,
    descripcion: '',
    cliente: data.quotation?.cliente ?? '',
    eventoId: data.eventId,
    numeroEvento,
    eventoEstado: event?.status ?? '',
    fechaEjecucion: event?.startDate ? String(event.startDate).slice(0, 10) : '',
    responsable: event?.name ?? '',
    dependencia: '',
    municipio: event?.municipalityName ?? '',
    aliadoId: data.allyId ? String(data.allyId) : (data.quotation?.ally?.id ?? undefined),
    aliado: data.ally?.name ?? data.quotation?.ally?.name ?? '',
    desembolso: event?.disbursement?.name ?? '',
    esquema: 'cotizacion',
    municipalityCategory: event?.municipalityCategory ?? '',
    estado: 'Definitiva' as OfferState,
    items,
    subtotal: Number(data.baseTotal ?? 0),
    ivaTotal: Number(data.ivaTotal ?? 0),
    impuestoConsumoTotal: Number(data.impuestoConsumoTotal ?? 0),
    feeTarifadoTotal: Number(data.feeTarifadoTotal ?? 0),
    feeTercerosTotal: Number(data.feeTercerosTotal ?? 0),
    ivaFeeTotal: Number(data.ivaFeeTotal ?? 0),
    total: Number(data.total ?? 0),
    createdAt: data.generatedAt ?? data.createdAt,
    updatedAt: data.updatedAt ?? data.createdAt,
  }
}

export async function getOfertasEconomicasApi(): Promise<OfertaEconomicaResponse[]> {
  const response = await api.get<OfertaEconomicaResponse[]>('/api/v1/ofertas-economicas')
  return response.data
}

export async function getOfertaEconomicaApi(id: string): Promise<OfertaEconomicaResponse> {
  const response = await api.get<OfertaEconomicaResponse>(`/api/v1/ofertas-economicas/${id}`)
  return response.data
}

export async function getOfertaEconomicaByEventApi(
  eventId: string,
): Promise<OfertaEconomicaResponse | null> {
  try {
    const response = await api.get<OfertaEconomicaResponse | null>(
      `/api/v1/ofertas-economicas/event/${eventId}`,
    )
    return response.data
  } catch {
    return null
  }
}
