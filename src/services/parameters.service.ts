import api from '../lib/api'

export interface ParametersResponse {
  id: string
  version: number
  ivaRate: number
  impuestoConsumoRate: number
  feeTarifadoRate: number
  feeTercerosRate: number
  ivaFeeRate: number
  applyFeeOnBase: boolean
  paramsVersion?: string
  aprobadoPor: string
  fechaInicio?: string
  fechaFin?: string
  fechaCreacion: string
  activo: boolean
}

export async function getActiveParametersApi(): Promise<ParametersResponse | null> {
  try {
    const response = await api.get<ParametersResponse>('/api/v1/parameters/active')
    return response.data
  } catch {
    return null
  }
}

export async function getParameterVersionsApi(): Promise<ParametersResponse[]> {
  const response = await api.get<ParametersResponse[]>('/api/v1/parameters/versions')
  return response.data
}

export async function getParameterVersionApi(id: string): Promise<ParametersResponse> {
  const response = await api.get<ParametersResponse>(`/api/v1/parameters/versions/${id}`)
  return response.data
}

export async function createParameterVersionApi(data: {
  ivaRate: number
  impuestoConsumoRate: number
  feeTarifadoRate: number
  feeTercerosRate: number
  ivaFeeRate: number
  applyFeeOnBase: boolean
  aprobadoPor: string
  fechaInicio?: string
  fechaFin?: string
}): Promise<ParametersResponse> {
  const response = await api.post<ParametersResponse>('/api/v1/parameters/versions', data)
  return response.data
}
