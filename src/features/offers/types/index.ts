import type { TaxCategory, Ally, Municipality, CalculationParams, Event } from '../../../types'

export type OfferState = 'Borrador' | 'Enviada' | 'Validada' | 'Aprobada' | 'Rechazada' | 'Definitiva'

export interface OfferItem {
  id: string
  ofertaId: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
  aliadoId?: string
  tariffId?: string
  base: number
  iva: number
  impuestoConsumo: number
  feeTarifado: number
  feeTerceros: number
  ivaFee: number
  total: number
}

export interface OfferItemInput {
  descripcion: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
  aliadoId?: string
  tariffId?: string
  isTariffed?: boolean
  ivaRate?: number
  consumptionTaxRate?: number
}

export interface Offer {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  cliente: string
  eventoId?: string
  numeroEvento?: string
  eventoEstado?: string
  fechaEjecucion?: string
  responsable?: string
  dependencia?: string
  municipio?: string
  aliadoId?: string
  aliado?: string
  desembolso?: string
  esquema?: string
  municipalityCategory?: string
  estado: OfferState
  items: OfferItem[]
  subtotal: number
  ivaTotal: number
  impuestoConsumoTotal: number
  feeTarifadoTotal: number
  feeTercerosTotal: number
  ivaFeeTotal: number
  total: number
  observations?: string | null
  createdAt: string
  updatedAt: string
  validadaPorId?: string
  validador?: string
  validadaEn?: string
  aprobadaPorId?: string
  aprobador?: string
  aprobadaEn?: string
}

export interface OfferInput {
  codigo: string
  nombre: string
  descripcion: string
  cliente: string
  eventoId?: string
  numeroEvento?: string
  responsable?: string
  dependencia?: string
  municipio?: string
  aliado?: string
  desembolso?: string
  esquema?: string
  quotationDate?: string
  items?: OfferItemInput[]
}

export const OFFER_STATES: OfferState[] = ['Borrador', 'Enviada', 'Validada', 'Aprobada', 'Rechazada', 'Definitiva']

export interface OfferExportOptions {
  event?: Event | null
  aliados?: Ally[]
  municipios?: Municipality[]
  rates?: CalculationParams
  usuario?: string
  fechaCorte?: Date
  filtros?: string
}

export const OFFER_STATE_COLORS: Record<OfferState, string> = {
  Borrador: 'bg-slate-100 text-slate-700',
  Enviada: 'bg-amber-100 text-amber-700',
  Validada: 'bg-blue-100 text-blue-700',
  Aprobada: 'bg-green-100 text-green-700',
  Rechazada: 'bg-red-100 text-red-700',
  Definitiva: 'bg-emerald-100 text-emerald-700',
}
