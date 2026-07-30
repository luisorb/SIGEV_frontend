import api from '../lib/api'
import type { CreateItemDto, UpdateItemDto } from './types'

export async function getItemsApi(): Promise<unknown[]> {
  const response = await api.get<unknown[]>('/api/v1/items')
  return response.data
}

export async function getItemApi(id: string): Promise<unknown> {
  const response = await api.get<unknown>(`/api/v1/items/${id}`)
  return response.data
}

export async function createItemApi(data: CreateItemDto): Promise<unknown> {
  const response = await api.post<unknown>('/api/v1/items', data)
  return response.data
}

export async function updateItemApi(id: string, data: UpdateItemDto): Promise<unknown> {
  const response = await api.patch<unknown>(`/api/v1/items/${id}`, data)
  return response.data
}

export async function deleteItemApi(id: string): Promise<unknown> {
  const response = await api.delete<unknown>(`/api/v1/items/${id}`)
  return response.data
}
