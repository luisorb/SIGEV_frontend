import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlliesApi, createAllyApi, updateAllyApi, deleteAllyApi } from '../services/allies.service'
import type { Ally } from '../types'
import type { CreateAllyDto, UpdateAllyDto } from '../services/types'

const ALLIES_KEY = ['allies']

function mapAllyResponse(data: { id: string; code: string; name: string; color?: string; active?: boolean; isActive?: boolean }): Ally {
  return {
    id: data.id,
    codigo: data.code,
    nombre: data.name,
    color: data.color ?? '#6366F1',
    activo: data.isActive ?? data.active ?? true,
  }
}

export function useAllies(options?: { all?: boolean }) {
  const all = options?.all ?? false
  return useQuery({
    queryKey: [...ALLIES_KEY, { all }],
    queryFn: async () => {
      const data = await getAlliesApi({ all })
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
