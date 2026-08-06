import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Offer, OfferState } from '../types'
import {
  getQuotationsApi,
  changeQuotationStatusApi,
  selectQuotationApi,
  deleteQuotationApi,
  mapQuotationResponse,
} from '../../../services/quotations.service'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { useAuth } from '../../auth/useAuth'
import { hasAnyRole } from '../../../lib/permissions'

export type QuotationPermission = 'create' | 'changeState' | 'delete'

const PERMISSION_ROLES: Record<QuotationPermission, readonly string[]> = {
  create: ['functional_admin', 'operator'],
  changeState: ['functional_admin', 'operator', 'approver'],
  delete: ['functional_admin'],
}

export function useQuotationPermissions(): {
  can: (perm: QuotationPermission) => boolean
} {
  const { user } = useAuth()
  const roleNames = user?.roleNames ?? []
  return { can: (perm: QuotationPermission) => hasAnyRole(roleNames, PERMISSION_ROLES[perm]) }
}

export const QUOTATIONS_KEY = ['quotations'] as const

export function useQuotations() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: quotations = [], isLoading, error } = useQuery({
    queryKey: QUOTATIONS_KEY,
    queryFn: async () => {
      const data = await getQuotationsApi()
      return data.map(mapQuotationResponse)
    },
  })

  const filteredQuotations = useMemo(() => {
    if (!search) return quotations
    const q = search.toLowerCase()
    return quotations.filter(
      (o) =>
        o.codigo.toLowerCase().includes(q) ||
        o.nombre.toLowerCase().includes(q) ||
        o.cliente.toLowerCase().includes(q) ||
        (o.numeroEvento ?? '').toLowerCase().includes(q)
    )
  }, [quotations, search])

  function getQuotation(id: string): Offer | undefined {
    return quotations.find((o) => o.id === id)
  }

  const selectMutation = useMutation({
    mutationFn: (id: string) => selectQuotationApi(id),
    onSuccess: async (data) => {
      const quotation = mapQuotationResponse(data)
      queryClient.setQueryData<Offer[]>(QUOTATIONS_KEY, (prev) =>
        (prev ?? []).map((o) => (o.id === quotation.id ? quotation : o))
      )
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      await queryClient.invalidateQueries({ queryKey: ['oferta-economica'] })
      addAuditEntry({
        accion: 'Selección de cotización',
        entidad: 'Quotation',
        entidadId: quotation.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización ${quotation.codigo} seleccionada; se generó la oferta económica definitiva`,
      })
    },
  })

  const stateMutation = useMutation({
    mutationFn: ({ id, estado, observation }: { id: string; estado: OfferState; observation?: string }) =>
      changeQuotationStatusApi(id, estado, observation),
    onSuccess: async (data) => {
      const quotation = mapQuotationResponse(data)
      queryClient.setQueryData<Offer[]>(QUOTATIONS_KEY, (prev) =>
        (prev ?? []).map((o) => (o.id === quotation.id ? quotation : o))
      )
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      await queryClient.invalidateQueries({ queryKey: ['oferta-economica'] })
      addAuditEntry({
        accion: 'Cambio de estado de cotización',
        entidad: 'Quotation',
        entidadId: quotation.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización ${quotation.codigo}: estado → ${quotation.estado}`,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuotationApi(id),
    onSuccess: async (_data, id) => {
      queryClient.setQueryData<Offer[]>(QUOTATIONS_KEY, (prev) =>
        (prev ?? []).filter((o) => o.id !== id)
      )
      await queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  async function selectQuotation(id: string): Promise<Offer> {
    const data = await selectMutation.mutateAsync(id)
    return mapQuotationResponse(data)
  }

  async function changeState(id: string, estado: OfferState, observation?: string) {
    await stateMutation.mutateAsync({ id, estado, observation })
  }

  async function removeQuotation(id: string) {
    await deleteMutation.mutateAsync(id)
  }

  return {
    quotations: filteredQuotations,
    allQuotations: quotations,
    isLoading,
    error,
    search,
    setSearch,
    getQuotation,
    selectQuotation,
    changeState,
    removeQuotation,
  }
}
