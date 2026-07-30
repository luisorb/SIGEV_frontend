import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlliesApi, createAllyApi, updateAllyApi, deleteAllyApi } from '../services/allies.service'
import type { Ally } from '../types'
import type { CreateAllyDto, UpdateAllyDto } from '../services/types'

const ALLIES_KEY = ['allies']

function mapAllyResponse(data: { id: string; name: string; color?: string; document?: string; contactName?: string; contactEmail?: string; active?: boolean }): Ally {
  return {
    id: data.id,
    nombre: data.name,
    nit: data.document ?? '',
    contacto: data.contactName ?? '',
    email: data.contactEmail ?? '',
    telefono: '',
    color: data.color ?? '#6366F1',
    activo: data.active ?? true,
  }
}

export function useAllies() {
  return useQuery({
    queryKey: ALLIES_KEY,
    queryFn: async () => {
      const data = await getAlliesApi()
      return data.map(mapAllyResponse)
    },
  })
}

export function useCreateAlly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAllyDto) => createAllyApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALLIES_KEY }),
  })
}

export function useUpdateAlly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAllyDto }) => updateAllyApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALLIES_KEY }),
  })
}

export function useDeleteAlly() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAllyApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALLIES_KEY }),
  })
}
