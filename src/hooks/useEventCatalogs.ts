import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEventCatalogsApi, createEventCatalogApi, updateEventCatalogApi } from '../services/event-catalogs.service'
import type { EventCatalog } from '../types'
import type { CreateEventCatalogDto, UpdateEventCatalogDto } from '../services/types'

const EVENT_CATALOGS_KEY = ['event-catalogs']

function mapEventCatalogResponse(data: {
  id: string
  name: string
  createdBy?: { id: string; fullName: string } | null
  isActive?: boolean
}): EventCatalog {
  return {
    id: data.id,
    nombre: data.name,
    creadoPor: data.createdBy?.fullName ?? '—',
    activo: data.isActive !== false,
  }
}

export function useEventCatalogs(options?: { all?: boolean }) {
  const all = options?.all ?? false
  return useQuery({
    queryKey: ['event-catalogs', { all }],
    queryFn: async () => {
      const data = await getEventCatalogsApi(all ? 'all' : undefined)
      return data.map(mapEventCatalogResponse)
    },
  })
}

export function useCreateEventCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateEventCatalogDto) => createEventCatalogApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENT_CATALOGS_KEY }),
  })
}

export function useUpdateEventCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEventCatalogDto }) => updateEventCatalogApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENT_CATALOGS_KEY }),
  })
}