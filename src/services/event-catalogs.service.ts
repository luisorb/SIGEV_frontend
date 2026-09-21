import api from '../lib/api'
import type { CreateEventCatalogDto, UpdateEventCatalogDto } from './types'

export interface EventCatalogCreatedBy {
  id: string
  fullName: string
}

export interface EventCatalogResponse {
  id: string
  name: string
  createdBy?: EventCatalogCreatedBy | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export async function getEventCatalogsApi(active?: string): Promise<EventCatalogResponse[]> {
  const query = active ? `?active=${encodeURIComponent(active)}` : ''
  const response = await api.get<EventCatalogResponse[]>(`/api/v1/event-catalogs${query}`)
  return response.data
}

export async function createEventCatalogApi(data: CreateEventCatalogDto): Promise<EventCatalogResponse> {
  const response = await api.post<EventCatalogResponse>('/api/v1/event-catalogs', data)
  return response.data
}

export async function updateEventCatalogApi(id: string, data: UpdateEventCatalogDto): Promise<EventCatalogResponse> {
  const response = await api.patch<EventCatalogResponse>(`/api/v1/event-catalogs/${id}`, data)
  return response.data
}