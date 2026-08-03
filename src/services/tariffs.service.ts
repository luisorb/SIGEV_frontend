import api from '../lib/api'

export interface TariffResponse {
  id: string
  code: string
  name: string
  description?: string | null
  sheet: string
  unitMeasure?: string | null
  tariffType: 'TARIFADO' | 'NO_TARIFADO'
  vigencyYear: number
  priceEspecialPrimera?: number | string | null
  priceSegundaCuarta?: number | string | null
  priceQuintaSexta?: number | string | null
  isActive: boolean
}

interface TariffQuery {
  search?: string
  sheet?: string
  tariffType?: string
  vigencyYear?: number
}

export async function getTariffsApi(params?: TariffQuery): Promise<TariffResponse[]> {
  const response = await api.get<TariffResponse[]>('/api/v1/tariffs', { params })
  return response.data
}

export async function getTariffPriceApi(
  id: string,
  municipalityCategory?: string,
): Promise<number> {
  const response = await api.get<number>(`/api/v1/tariffs/${id}/price`, {
    params: { municipalityCategory },
  })
  return Number(response.data)
}
