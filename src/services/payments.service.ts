import api from '../lib/api'
import type { CreatePaymentDto, UpdatePaymentDto } from './types'

export interface PaymentResponse {
  id: string
  eventId: string
  disbursementId?: string
  amount: number
  type: string
  status: string
  paymentDate?: string
  description?: string
  createdAt: string
  event?: { id: string; code: string; suffix: string; name: string; disbursementId?: string }
  disbursement?: { id: string; code?: string; name: string; amount: number; year: number }
  createdBy?: { id: string; fullName: string }
}

export interface PaymentSummaryRow {
  disbursementId: string
  name: string
  amount: number
  paid: number
  available: number
  percentage: number
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
