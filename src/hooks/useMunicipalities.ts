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
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}
