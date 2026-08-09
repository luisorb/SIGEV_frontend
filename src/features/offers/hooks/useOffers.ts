import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Offer } from '../types'
import {
  getOfertasEconomicasApi,
  mapOfertaEconomicaToOffer,
} from '../../../services/offers.service'
import { exportOfferToExcel } from '../utils/excelExport'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { useAuth } from '../../auth/useAuth'
import { hasAnyRole } from '../../../lib/permissions'

export type UserPermission = 'export'

const PERMISSION_ROLES: Record<UserPermission, readonly string[]> = {
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

export function useOffers() {
  const [search, setSearch] = useState('')

  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: OFFERS_KEY,
    queryFn: async () => {
      const data = await getOfertasEconomicasApi()
      return data.map(mapOfertaEconomicaToOffer)
    },
  })

  const filteredOffers = useMemo(() => {
    if (!search) return offers
    const q = search.toLowerCase()
    return offers.filter(
      (o) =>
        o.codigo.toLowerCase().includes(q) ||
        o.cliente.toLowerCase().includes(q) ||
        (o.numeroEvento ?? '').toLowerCase().includes(q) ||
        (o.responsable ?? '').toLowerCase().includes(q) ||
        (o.municipio ?? '').toLowerCase().includes(q)
    )
  }, [offers, search])

  function getOffer(id: string): Offer | undefined {
    return offers.find((o) => o.id === id)
  }

  function handleExport(offerId: string) {
    const offer = getOffer(offerId)
    if (!offer) return
    exportOfferToExcel(offer)
    addAuditEntry({
      accion: 'Exportación de oferta económica definitiva',
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
    exportOffer: handleExport,
  }
}
