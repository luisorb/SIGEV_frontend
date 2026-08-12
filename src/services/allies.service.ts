import api from '../lib/api'
import type { CreateAllyDto, UpdateAllyDto } from './types'

export interface AllyResponse {
  id: string
  code: string
  name: string
  documentType?: string
  document?: string
  phone?: string
  contactEmail?: string
  divipolaCode?: string
  divipolaDepartment?: string
  contactName?: string
  color?: string
  active?: boolean
  isActive?: boolean
}

export async function getAlliesApi(options?: { all?: boolean }): Promise<AllyResponse[]> {
  const query = options?.all ? '?all=true' : ''
  const response = await api.get<AllyResponse[]>(`/api/v1/allies${query}`)
  return response.data
}

export async function getAllyApi(id: string): Promise<AllyResponse> {
  const response = await api.get<AllyResponse>(`/api/v1/allies/${id}`)
  return response.data
}

export async function createAllyApi(data: CreateAllyDto): Promise<AllyResponse> {
  const response = await api.post<AllyResponse>('/api/v1/allies', data)
  return response.data
}

export async function updateAllyApi(id: string, data: UpdateAllyDto): Promise<AllyResponse> {
  const response = await api.patch<AllyResponse>(`/api/v1/allies/${id}`, data)
  return response.data
}

export async function deleteAllyApi(id: string): Promise<void> {
  await api.delete(`/api/v1/allies/${id}`)
}
