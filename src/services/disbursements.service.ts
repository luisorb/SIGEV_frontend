import api from '../lib/api'
import type { CreateDisbursementDto, UpdateDisbursementDto } from './types'

export interface DisbursementResponse {
  id: string
  code?: string
  name: string
  amount: number
  year: number
  percentageParticipation?: number
  disbursementDate?: string
  fechaInicio?: string
  fechaFin?: string
  status?: string
  isActive?: boolean
  active?: boolean
}

export interface DisbursementSummaryEventRow {
  eventId: string
  code: string
  suffix: string
  name: string
  monto: number
  pagado: number
  pendiente: number
}

export interface DisbursementSummary {
  id: string
  code: string | null
  name: string
  valorRef: number
  ejecutado: number
  disponible: number
  porcentajeEjecucion: number
  porcentajeParticipacion: number
  year: number
  status: string | null
  isActive: boolean
  porEvento: DisbursementSummaryEventRow[]
}

export async function getDisbursementsApi(active?: string): Promise<DisbursementResponse[]> {
  const query = active ? `?active=${encodeURIComponent(active)}` : ''
  const response = await api.get<DisbursementResponse[]>(`/api/v1/disbursements${query}`)
  return response.data
}

export async function getDisbursementApi(id: string): Promise<DisbursementResponse> {
  const response = await api.get<DisbursementResponse>(`/api/v1/disbursements/${id}`)
  return response.data
}

export async function getDisbursementSummaryApi(id: string): Promise<DisbursementSummary> {
  const response = await api.get<DisbursementSummary>(`/api/v1/disbursements/${id}/summary`)
  return response.data
}

export async function createDisbursementApi(data: CreateDisbursementDto): Promise<DisbursementResponse> {
  const response = await api.post<DisbursementResponse>('/api/v1/disbursements', data)
  return response.data
}

export async function updateDisbursementApi(id: string, data: UpdateDisbursementDto): Promise<DisbursementResponse> {
  const response = await api.patch<DisbursementResponse>(`/api/v1/disbursements/${id}`, data)
  return response.data
}

export async function deleteDisbursementApi(id: string): Promise<void> {
  await api.delete(`/api/v1/disbursements/${id}`)
}
