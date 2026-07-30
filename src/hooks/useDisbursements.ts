import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDisbursementsApi, createDisbursementApi, updateDisbursementApi, deleteDisbursementApi } from '../services/disbursements.service'
import type { Disbursement } from '../types'
import type { CreateDisbursementDto, UpdateDisbursementDto } from '../services/types'

const DISBURSEMENTS_KEY = ['disbursements']

function mapDisbursementResponse(data: { id: string; name: string; amount: number; year: number; status?: string; active?: boolean }): Disbursement {
  return {
    id: data.id,
    nombre: data.name,
    codigo: `D${data.year}`,
    porcentajeParticipacion: 0,
    vigencia: String(data.year),
    valorReferencia: data.amount,
    activo: data.active ?? true,
  }
}

export function useDisbursements() {
  return useQuery({
    queryKey: DISBURSEMENTS_KEY,
    queryFn: async () => {
      const data = await getDisbursementsApi()
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
