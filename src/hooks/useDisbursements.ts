import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDisbursementsApi, createDisbursementApi, updateDisbursementApi, deleteDisbursementApi } from '../services/disbursements.service'
import type { Disbursement } from '../types'
import type { CreateDisbursementDto, UpdateDisbursementDto } from '../services/types'

const DISBURSEMENTS_KEY = ['disbursements']

function mapDisbursementResponse(data: { id: string; code?: string; name: string; amount: number; year: number; disbursementDate?: string; fechaInicio?: string; fechaFin?: string; status?: string; isActive?: boolean; active?: boolean }): Disbursement {
  const inicio = data.fechaInicio ? String(data.fechaInicio).slice(0, 10) : undefined
  const fin = data.fechaFin ? String(data.fechaFin).slice(0, 10) : undefined
  const vigencia = inicio
    ? (fin ? `${inicio} a ${fin}` : inicio)
    : (data.disbursementDate ? String(data.disbursementDate).slice(0, 10) : String(data.year))
  return {
    id: data.id,
    nombre: data.name,
    codigo: data.code || `D${data.year}`,
    vigencia,
    vigenciaInicio: inicio,
    vigenciaFin: fin,
    valorReferencia: data.amount,
    activo: data.isActive ?? data.active ?? true,
  }
}

export function useDisbursements(options?: { all?: boolean }) {
  const all = options?.all ?? false
  return useQuery({
    queryKey: ['disbursements', { all }],
    queryFn: async () => {
      const data = await getDisbursementsApi(all ? 'all' : undefined)
      return data.map(mapDisbursementResponse)
    },
  })
}

export function useCreateDisbursement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDisbursementDto) => createDisbursementApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISBURSEMENTS_KEY }),
  })
}

export function useUpdateDisbursement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDisbursementDto }) => updateDisbursementApi(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISBURSEMENTS_KEY }),
  })
}

export function useDeleteDisbursement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDisbursementApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DISBURSEMENTS_KEY }),
  })
}
