import { useQuery } from '@tanstack/react-query'
import { searchMunicipalitiesApi } from '../services/map.service'
import type { Municipality } from '../types'

export function useMunicipalities() {
  return useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const data = await searchMunicipalitiesApi({})
      return data.map((m): Municipality => ({
        id: m.divipolaCode ?? m.id,
        nombre: m.name,
        departamento: m.department,
        lat: m.latitude !== undefined ? Number(m.latitude) : undefined,
        lng: m.longitude !== undefined ? Number(m.longitude) : undefined,
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}
