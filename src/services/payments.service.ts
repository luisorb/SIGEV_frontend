import api from '../lib/api'
import type { CreatePaymentDto, UpdatePaymentDto, PaymentMethod } from './types'

export interface PaymentItemResponse {
  id: string
  itemId: string
  amount: number
  item?: { id: string; name: string; totalValue: number }
}

export interface AttachmentResponse {
  id: string
  originalName: string
  mimeType: string
  fileSize: number
  category?: string
}

export interface PaymentResponse {
  id: string
  eventId: string
  disbursementId?: string
  amount: number
  method?: PaymentMethod
  esAdicional?: boolean
  status: string
  description?: string
  createdAt: string
  event?: { id: string; code: string; suffix: string; name: string; disbursementId?: string }
  disbursement?: { id: string; code?: string; name: string; amount: number; year: number }
  createdBy?: { id: string; fullName: string }
  paymentItems?: PaymentItemResponse[]
  attachments?: AttachmentResponse[]
}

export interface PaymentSummaryEventRow {
  eventId: string
  code: string
  suffix: string
  name: string
  monto: number
  pagado: number
  pendiente: number
}

export interface PaymentSummaryRow {
  disbursementId: string
  name: string
  amount: number
  paid: number
  available: number
  percentage: number
  valorRef: number
  ejecutado: number
  disponible: number
  porcentajeEjecucion: number
  porcentajeParticipacion: number
  porEvento: PaymentSummaryEventRow[]
}

export async function getPaymentsApi(eventId?: string): Promise<PaymentResponse[]> {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
  const response = await api.get<PaymentResponse[]>(`/api/v1/payments${query}`)
  return response.data
}

export async function getPaymentsSummaryApi(): Promise<PaymentSummaryRow[]> {
  const response = await api.get<PaymentSummaryRow[]>('/api/v1/payments/summary')
  return response.data
}

export async function createPaymentApi(data: CreatePaymentDto): Promise<PaymentResponse> {
  const response = await api.post<PaymentResponse>('/api/v1/payments', data)
  return response.data
}

export async function updatePaymentApi(id: string, data: UpdatePaymentDto): Promise<PaymentResponse> {
  const response = await api.patch<PaymentResponse>(`/api/v1/payments/${id}`, data)
  return response.data
}

export async function deletePaymentApi(id: string): Promise<void> {
  await api.delete(`/api/v1/payments/${id}`)
}
