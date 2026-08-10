import api from '../lib/api'
import type { MunicipalityQuery } from './types'

export interface MunicipalityResponse {
  id: string
  name: string
  department: string
  category?: string
  divipolaCode?: string
  latitude?: number
  longitude?: number
}

export async function searchMunicipalitiesApi(query: MunicipalityQuery): Promise<MunicipalityResponse[]> {
  const params: Record<string, string> = {}
  if (query.divipolaCode) params.divipolaCode = query.divipolaCode
  if (query.name) params.name = query.name
  if (query.department) params.department = query.department
  const response = await api.get<MunicipalityResponse[]>('/api/v1/map/municipalities', { params })
  return response.data
}

export async function getMunicipalityByCodeApi(code: string): Promise<MunicipalityResponse> {
  const response = await api.get<MunicipalityResponse>(`/api/v1/map/municipalities/${code}`)
  return response.data
}

export async function getMunicipalitiesByCategoryApi(category: string): Promise<MunicipalityResponse[]> {
  const response = await api.get<MunicipalityResponse[]>(`/api/v1/map/municipalities/category/${category}`)
  return response.data
}

export interface MunicipalityStatsQuery {
  divipolaCode?: string
  generalAllyId?: string
  disbursementId?: string
  status?: string
}

export interface MunicipalityStatsEntry {
  id: string
  numeroEvento: string
  responsable: string
  estado: string
  aliadoId?: string
  total: number
  lat?: number
  lng?: number
}

export interface MunicipalityStatsResponse {
  municipioId: string
  municipioNombre: string
  departamento: string
  lat: number
  lng: number
  totalEventos: number
  totalValor: number
  eventos: MunicipalityStatsEntry[]
}

export async function getMunicipalityStatsApi(
  query: MunicipalityStatsQuery = {},
): Promise<MunicipalityStatsResponse[]> {
  const params: Record<string, string> = {}
  if (query.divipolaCode) params.divipolaCode = query.divipolaCode
  if (query.generalAllyId) params.generalAllyId = query.generalAllyId
  if (query.disbursementId) params.disbursementId = query.disbursementId
  if (query.status) params.status = query.status
  const response = await api.get<MunicipalityStatsResponse[]>('/api/v1/map/municipality-stats', { params })
  return response.data
}
