import type { TaxCategory } from '../../../types'

export type OfferState = 'Borrador' | 'Enviada' | 'Aprobada' | 'Rechazada'

export interface OfferItem {
  id: string
  ofertaId: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
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
}

export interface Offer {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  cliente: string
  estado: OfferState
  items: OfferItem[]
  subtotal: number
  ivaTotal: number
  impuestoConsumoTotal: number
  feeTarifadoTotal: number
  feeTercerosTotal: number
  ivaFeeTotal: number
  total: number
  createdAt: string
  updatedAt: string
}

export interface OfferInput {
  codigo: string
  nombre: string
  descripcion: string
  cliente: string
}

export const OFFER_STATES: OfferState[] = ['Borrador', 'Enviada', 'Aprobada', 'Rechazada']

export const OFFER_STATE_COLORS: Record<OfferState, string> = {
  Borrador: 'bg-slate-100 text-slate-700',
  Enviada: 'bg-red-100 text-red-700',
  Aprobada: 'bg-green-100 text-green-700',
  Rechazada: 'bg-red-100 text-red-700',
}
