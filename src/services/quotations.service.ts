import api from '../lib/api'
import type {
  CreateQuotationDto,
  UpdateQuotationDto,
  ChangeQuotationStatusDto,
  CreateQuotationItemDto,
} from './types'
import type { Offer, OfferItem, OfferItemInput, OfferState, OfferInput } from '../features/offers/types'
import type { TaxCategory } from '../types'

export interface QuotationItemResponse {
  id: string
  quotationId: string
  description: string
  quantity: number
  unitPrice: number | string
  ivaRate: number | string
  ivaValue: number | string
  consumptionTaxRate: number | string
  consumptionTaxValue: number | string
  feeRate: number | string
  feeValue: number | string
  feeIvaRate: number | string
  feeIvaValue: number | string
  totalValue: number | string
  allyId?: string | null
  tariffId?: string | null
  isTariffed: boolean
  isActive: boolean
}

export interface QuotationResponse {
  id: string
  code: string
  name: string
  description?: string | null
  cliente?: string | null
  status: string
  isDefinitive: boolean
  amount: number | string
  currency?: string | null
  quotationDate?: string | null
  validityDays?: number | null
  observations?: string | null
  validadaPorId?: string | null
  validadaEn?: string | null
  aprobadaPorId?: string | null
  aprobadaEn?: string | null
  validadaPor?: { id: string; fullName: string } | null
  aprobadaPor?: { id: string; fullName: string } | null
  createdBy?: { id: string; fullName?: string } | null
  eventId?: string | null
  allyId?: string | null
  createdAt: string
  updatedAt: string
  isActive: boolean
  event?: {
    id: string
    code: string
    suffix?: string | null
    name?: string | null
    dependency?: string | null
    municipalityName?: string | null
    divipolaCode?: string | null
    municipalityCategory?: string | null
    schemaType?: string | null
    generalAllyId?: string | null
    disbursement?: { name: string } | null
  } | null
  ally?: { id: string; name: string } | null
  items?: QuotationItemResponse[]
}

function mapQuotationItem(
  data: QuotationItemResponse,
  quotationId: string,
): OfferItem {
  const ivaRate = Number(data.ivaRate ?? 0)
  const consumptionTaxRate = Number(data.consumptionTaxRate ?? 0)
  const feeValue = Number(data.feeValue ?? 0)
  const categoriaTributaria: TaxCategory =
    ivaRate > 0 ? 'IVA' : consumptionTaxRate > 0 ? 'Consumo' : 'Tercero'
  const esTarifada = categoriaTributaria === 'IVA' || categoriaTributaria === 'Consumo'
  const cantidad = Number(data.quantity ?? 0)
  const valorUnitario = Number(data.unitPrice ?? 0)
  return {
    id: data.id,
    ofertaId: quotationId,
    descripcion: data.description,
    cantidad,
    valorUnitario,
    categoriaTributaria,
    aliadoId: data.allyId ? String(data.allyId) : undefined,
    tariffId: data.tariffId ? String(data.tariffId) : undefined,
    base: cantidad * valorUnitario,
    iva: Number(data.ivaValue ?? 0),
    impuestoConsumo: Number(data.consumptionTaxValue ?? 0),
    feeTarifado: esTarifada ? feeValue : 0,
    feeTerceros: esTarifada ? 0 : feeValue,
    ivaFee: Number(data.feeIvaValue ?? 0),
    total: Number(data.totalValue ?? 0),
  }
}

export function mapQuotationResponse(data: QuotationResponse): Offer {
  const items = Array.isArray(data.items) ? data.items.map((it) => mapQuotationItem(it, data.id)) : []

  const event = data.event
  const numeroEvento = event ? `${event.code}${event.suffix ? `-${event.suffix}` : ''}` : ''

  const total = items.reduce((sum, it) => sum + it.total, 0)
  return {
    id: data.id,
    codigo: data.code,
    nombre: data.name,
    descripcion: data.description ?? '',
    cliente: data.cliente ?? '',
    eventoId: data.eventId ?? undefined,
    numeroEvento,
    responsable: event?.name ?? '',
    dependencia: event?.dependency ?? '',
    municipio: event?.municipalityName ?? event?.divipolaCode ?? '',
    municipalityCategory: event?.municipalityCategory ?? '',
    aliado: data.ally?.name ?? '',
    desembolso: event?.disbursement?.name ?? '',
    esquema: event?.schemaType ?? 'cotizacion',
    estado: (data.status ?? 'Borrador') as OfferState,
    items,
    subtotal: items.reduce((sum, it) => sum + it.base, 0),
    ivaTotal: items.reduce((sum, it) => sum + it.iva, 0),
    impuestoConsumoTotal: items.reduce((sum, it) => sum + it.impuestoConsumo, 0),
    feeTarifadoTotal: items.reduce((sum, it) => sum + it.feeTarifado, 0),
    feeTercerosTotal: items.reduce((sum, it) => sum + it.feeTerceros, 0),
    ivaFeeTotal: items.reduce((sum, it) => sum + it.ivaFee, 0),
    total,
    observations: data.observations ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    createdById: data.createdBy?.id ?? undefined,
    validadaPorId: data.validadaPorId ?? undefined,
    validadaEn: data.validadaEn ?? undefined,
    aprobadaPorId: data.aprobadaPorId ?? undefined,
    aprobadaEn: data.aprobadaEn ?? undefined,
    validador: data.validadaPor?.fullName ?? undefined,
    aprobador: data.aprobadaPor?.fullName ?? undefined,
  }
}

export function mapOfferItemToCreateDto(item: OfferItem | OfferItemInput): CreateQuotationItemDto {
  return {
    ...('itemId' in item && item.itemId ? { itemId: item.itemId } : {}),
    description: item.descripcion,
    quantity: item.cantidad,
    unitPrice: item.valorUnitario,
    ...('aliadoId' in item && item.aliadoId ? { allyId: item.aliadoId } : {}),
    ...('tariffId' in item && item.tariffId ? { tariffId: item.tariffId, isTariffed: true } : {}),
    ...('ivaRate' in item && item.ivaRate !== undefined ? { ivaRate: item.ivaRate } : {}),
    ...('consumptionTaxRate' in item && item.consumptionTaxRate !== undefined
      ? { consumptionTaxRate: item.consumptionTaxRate }
      : {}),
  }
}

function mapOfferInputToCreateDto(input: OfferInput): CreateQuotationDto {
  return {
    code: input.codigo || undefined,
    name: input.nombre,
    description: input.descripcion || undefined,
    cliente: input.cliente || undefined,
    ...(input.eventoId ? { eventId: input.eventoId } : {}),
    ...(input.quotationDate ? { quotationDate: input.quotationDate } : {}),
    ...(input.items?.length ? { items: input.items.map(mapOfferItemToCreateDto) } : {}),
  }
}

export async function getQuotationsApi(): Promise<QuotationResponse[]> {
  const response = await api.get<QuotationResponse[]>('/api/v1/quotations')
  return response.data
}

export async function getQuotationApi(id: string): Promise<QuotationResponse> {
  const response = await api.get<QuotationResponse>(`/api/v1/quotations/${id}`)
  return response.data
}

export async function createQuotationApi(input: OfferInput): Promise<QuotationResponse> {
  const response = await api.post<QuotationResponse>('/api/v1/quotations', mapOfferInputToCreateDto(input))
  return response.data
}

export async function updateQuotationApi(
  id: string,
  input: Partial<OfferInput>,
): Promise<QuotationResponse> {
  const dto: UpdateQuotationDto = {
    ...(input.codigo !== undefined ? { code: input.codigo } : {}),
    ...(input.nombre !== undefined ? { name: input.nombre } : {}),
    ...(input.descripcion !== undefined ? { description: input.descripcion } : {}),
    ...(input.cliente !== undefined ? { cliente: input.cliente } : {}),
    ...(input.eventoId !== undefined ? { eventId: input.eventoId } : {}),
    ...(input.items !== undefined
      ? { items: input.items.map((it) => mapOfferItemToCreateDto(it)) }
      : {}),
  }
  const response = await api.patch<QuotationResponse>(`/api/v1/quotations/${id}`, dto)
  return response.data
}

export async function changeQuotationStatusApi(
  id: string,
  status: OfferState,
  observation?: string,
): Promise<QuotationResponse> {
  const dto: ChangeQuotationStatusDto = { status, ...(observation !== undefined ? { observation } : {}) }
  const response = await api.patch<QuotationResponse>(`/api/v1/quotations/${id}/status`, dto)
  return response.data
}

export async function validateQuotationApi(id: string): Promise<QuotationResponse> {
  const response = await api.patch<QuotationResponse>(`/api/v1/quotations/${id}/validate`)
  return response.data
}

export async function selectQuotationApi(id: string, itemIds?: string[]): Promise<QuotationResponse> {
  const response = await api.patch<QuotationResponse>(
    `/api/v1/quotations/${id}/select`,
    itemIds?.length ? { items: itemIds.map((quotationItemId) => ({ quotationItemId })) } : undefined
  )
  return response.data
}

export async function deleteQuotationApi(id: string): Promise<void> {
  await api.delete(`/api/v1/quotations/${id}`)
}
