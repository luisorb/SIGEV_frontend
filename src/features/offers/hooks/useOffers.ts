import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Offer, OfferInput, OfferItem, OfferItemInput, OfferState } from '../types'
import {
  getQuotationsApi,
  createQuotationApi,
  updateQuotationApi,
  changeQuotationStatusApi,
  selectQuotationApi,
  deleteQuotationApi,
  mapQuotationResponse,
} from '../../../services/quotations.service'
import { calculateItemPreview, calculateEventSummary } from '../../../utils/calculationEngine'
import type { CalculationParams } from '../../../types'
import { useActiveCalculationParams } from '../../../hooks/useActiveCalculationParams'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { exportOfferToExcel } from '../utils/excelExport'
import { useAuth } from '../../auth/useAuth'
import { hasAnyRole } from '../../../lib/permissions'

export type UserPermission = 'create' | 'edit' | 'delete' | 'changeState' | 'export'

const PERMISSION_ROLES: Record<UserPermission, readonly string[]> = {
  create: ['functional_admin', 'operator'],
  edit: ['functional_admin', 'operator'],
  delete: ['functional_admin'],
  changeState: ['functional_admin', 'operator', 'approver'],
  export: ['technical_admin', 'functional_admin', 'approver', 'operator', 'solicitante', 'analista', 'supervisor', 'auditor', 'consulta'],
}

export const OFFERS_KEY = ['offers'] as const

export function usePermissions(): {
  can: (perm: UserPermission) => boolean
} {
  const { user } = useAuth()
  const roleNames = user?.roleNames ?? []
  return { can: (perm: UserPermission) => hasAnyRole(roleNames, PERMISSION_ROLES[perm]) }
}

function recomputeOffer(offer: Offer, items: OfferItem[], params: CalculationParams): Offer {
  const { eventTotals } = calculateEventSummary(
    items.map((it) => ({
      descripcion: it.descripcion,
      cantidad: it.cantidad,
      valorUnitario: it.valorUnitario,
      categoriaTributaria: it.categoriaTributaria,
    })),
    params,
  )
  return {
    ...offer,
    items,
    subtotal: eventTotals.baseTotal,
    ivaTotal: eventTotals.ivaTotal,
    impuestoConsumoTotal: eventTotals.impuestoConsumoTotal,
    feeTarifadoTotal: eventTotals.feeTarifadoTotal,
    feeTercerosTotal: eventTotals.feeTercerosTotal,
    ivaFeeTotal: eventTotals.ivaFeeTotal,
    total: eventTotals.granTotal,
  }
}

export function useOffers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const params = useActiveCalculationParams()

  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: OFFERS_KEY,
    queryFn: async () => {
      const data = await getQuotationsApi()
      return data.map(mapQuotationResponse)
    },
  })

  const filteredOffers = useMemo(() => {
    if (!search) return offers
    const q = search.toLowerCase()
    return offers.filter(
      (o) =>
        o.codigo.toLowerCase().includes(q) ||
        o.nombre.toLowerCase().includes(q) ||
        o.cliente.toLowerCase().includes(q) ||
        (o.numeroEvento ?? '').toLowerCase().includes(q) ||
        (o.responsable ?? '').toLowerCase().includes(q) ||
        (o.municipio ?? '').toLowerCase().includes(q)
    )
  }, [offers, search])

  function getOffer(id: string): Offer | undefined {
    return offers.find((o) => o.id === id)
  }

  const createMutation = useMutation({
    mutationFn: (input: OfferInput) => createQuotationApi(input),
    onSuccess: async (data) => {
      const offer = mapQuotationResponse(data)
      queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) => [offer, ...(prev ?? [])])
      addAuditEntry({
        accion: 'Creación de oferta',
        entidad: 'Offer',
        entidadId: offer.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Oferta ${offer.codigo} creada para cliente ${offer.cliente}`,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<OfferInput> & { items?: OfferItem[] } }) =>
      updateQuotationApi(id, input),
    onSuccess: async (data) => {
      const offer = mapQuotationResponse(data)
      queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) =>
        (prev ?? []).map((o) => (o.id === offer.id ? offer : o))
      )
    },
  })

  const stateMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: OfferState }) =>
      changeQuotationStatusApi(id, estado),
    onSuccess: async (data) => {
      const offer = mapQuotationResponse(data)
      queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) =>
        (prev ?? []).map((o) => (o.id === offer.id ? offer : o))
      )
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      addAuditEntry({
        accion: 'Cambio de estado de oferta',
        entidad: 'Offer',
        entidadId: offer.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Oferta ${offer.codigo}: estado → ${offer.estado}`,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuotationApi(id),
    onSuccess: async (_data, id) => {
      queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) => (prev ?? []).filter((o) => o.id !== id))
      await queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const selectMutation = useMutation({
    mutationFn: (id: string) => selectQuotationApi(id),
    onSuccess: async (data) => {
      const offer = mapQuotationResponse(data)
      queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) =>
        (prev ?? []).map((o) => (o.id === offer.id ? offer : o))
      )
      await queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  async function createOffer(input: OfferInput): Promise<Offer> {
    const data = await createMutation.mutateAsync(input)
    return mapQuotationResponse(data)
  }

  async function updateOffer(id: string, input: Partial<OfferInput>) {
    const current = getOffer(id)
    await updateMutation.mutateAsync({ id, input: { ...input, items: current?.items ?? [] } })
    await queryClient.invalidateQueries({ queryKey: OFFERS_KEY })
  }

  async function changeState(id: string, estado: OfferState) {
    await stateMutation.mutateAsync({ id, estado })
  }

  async function selectOffer(id: string) {
    await selectMutation.mutateAsync(id)
  }

  async function removeOffer(id: string) {
    await deleteMutation.mutateAsync(id)
  }

  function addItem(offerId: string, input: OfferItemInput) {
    const totals = calculateItemPreview(input, params)
    const offer = getOffer(offerId)
    if (!offer) return
    const newItem: OfferItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ofertaId: offerId,
      ...input,
      base: totals.base,
      iva: totals.iva,
      impuestoConsumo: totals.impuestoConsumo,
      feeTarifado: totals.feeTarifado,
      feeTerceros: totals.feeTerceros,
      ivaFee: totals.ivaFee,
      total: totals.total,
    }
    queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) =>
      (prev ?? []).map((o) => (o.id === offerId ? recomputeOffer(o, [...o.items, newItem], params) : o))
    )
  }

  function updateItem(offerId: string, itemId: string, input: Partial<OfferItemInput>) {
    queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) =>
      (prev ?? []).map((o) => {
        if (o.id !== offerId) return o
        const updatedItems = o.items.map((it) => {
          if (it.id !== itemId) return it
          const merged = { ...it, ...input }
          const totals = calculateItemPreview({
            descripcion: merged.descripcion,
            cantidad: merged.cantidad,
            valorUnitario: merged.valorUnitario,
            categoriaTributaria: merged.categoriaTributaria,
          }, params)
          return {
            ...merged,
            base: totals.base,
            iva: totals.iva,
            impuestoConsumo: totals.impuestoConsumo,
            feeTarifado: totals.feeTarifado,
            feeTerceros: totals.feeTerceros,
            ivaFee: totals.ivaFee,
            total: totals.total,
          }
        })
        return recomputeOffer(o, updatedItems, params)
      })
    )
  }

  function removeItem(offerId: string, itemId: string) {
    queryClient.setQueryData<Offer[]>(OFFERS_KEY, (prev) =>
      (prev ?? []).map((o) =>
        o.id === offerId ? recomputeOffer(o, o.items.filter((it) => it.id !== itemId), params) : o
      )
    )
  }

  function handleExport(offerId: string) {
    const offer = getOffer(offerId)
    if (!offer) return
    exportOfferToExcel(offer)
    addAuditEntry({
      accion: 'Exportación de oferta',
      entidad: 'Offer',
      entidadId: offerId,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Oferta ${offer.codigo} exportada a Excel`,
    })
  }

  return {
    offers: filteredOffers,
    allOffers: offers,
    isLoading,
    error,
    search,
    setSearch,
    getOffer,
    createOffer,
    updateOffer,
    changeState,
    selectOffer,
    removeOffer,
    addItem,
    updateItem,
    removeItem,
    exportOffer: handleExport,
  }
}
