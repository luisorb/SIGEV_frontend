import api from '../lib/api'
import type { CreateDisbursementDto, UpdateDisbursementDto } from './types'

export interface DisbursementResponse {
  id: string
  name: string
  amount: number
  year: number
  status?: string
  active?: boolean
}

export async function getDisbursementsApi(): Promise<DisbursementResponse[]> {
  const response = await api.get<DisbursementResponse[]>('/api/v1/disbursements')
  return response.data
}

export async function getDisbursementApi(id: string): Promise<DisbursementResponse> {
  const response = await api.get<DisbursementResponse>(`/api/v1/disbursements/${id}`)
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
