import { useState, useMemo, useRef } from 'react'
import type { Offer, OfferInput, OfferItemInput, OfferState } from '../types'
import { mockOffers } from '../utils/mockOffers'
import { calculateItemPreview, calculateEventSummary } from '../../../utils/calculationEngine'
import { addAuditEntry } from '../../../lib/auditStore'
import { CURRENT_USER } from '../../../config/constants'
import { exportOfferToExcel } from '../utils/excelExport'

export type UserPermission = 'create' | 'edit' | 'delete' | 'changeState' | 'export'

const ROLE_PERMISSIONS: Record<string, UserPermission[]> = {
  Administrador: ['create', 'edit', 'delete', 'changeState', 'export'],
  Operador: ['create', 'edit', 'export'],
  Supervisor: ['edit', 'changeState', 'export'],
  Consulta: ['export'],
  Auditor: [],
}

export function usePermissions(currentRole: string = 'Administrador'): {
  can: (perm: UserPermission) => boolean
} {
  const perms = ROLE_PERMISSIONS[currentRole] ?? []
  return { can: (perm: UserPermission) => perms.includes(perm) }
}

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>(mockOffers)
  const [search, setSearch] = useState('')
  const idCounter = useRef(0)

  function nextId(): string {
    idCounter.current += 1
    return idCounter.current.toString(36)
  }

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

  function createOffer(input: OfferInput): Offer {
    const newOffer: Offer = {
      id: `OFR-${nextId()}`,
      ...input,
      estado: 'Borrador',
      items: [],
      subtotal: 0,
      ivaTotal: 0,
      impuestoConsumoTotal: 0,
      feeTarifadoTotal: 0,
      feeTercerosTotal: 0,
      ivaFeeTotal: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setOffers((prev) => [newOffer, ...prev])
    addAuditEntry({
      accion: 'Creación de oferta',
      entidad: 'Offer',
      entidadId: newOffer.id,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Oferta ${newOffer.codigo} creada para cliente ${newOffer.cliente}`,
    })
    return newOffer
  }

  function updateOffer(id: string, input: Partial<OfferInput>) {
    const prev = offers.find((o) => o.id === id)
    setOffers((prevOffers) =>
      prevOffers.map((o) =>
        o.id === id ? { ...o, ...input, updatedAt: new Date().toISOString() } : o
      )
    )
    if (prev) {
      addAuditEntry({
        accion: 'Edición de oferta',
        entidad: 'Offer',
        entidadId: id,
        usuario: CURRENT_USER,
        fecha: new Date().toISOString(),
        detalle: `Oferta ${prev.codigo} actualizada`,
      })
    }
  }

  function changeState(id: string, estado: OfferState) {
    const prev = offers.find((o) => o.id === id)
    setOffers((prevOffers) =>
      prevOffers.map((o) => (o.id === id ? { ...o, estado, updatedAt: new Date().toISOString() } : o))
    )
    if (prev) {
      addAuditEntry({
        accion: 'Cambio de estado de oferta',
        entidad: 'Offer',
        entidadId: id,
        usuario: CURRENT_USER,
        fecha: new Date().toISOString(),
        detalle: `Oferta ${prev.codigo}: ${prev.estado} → ${estado}`,
      })
    }
  }

  function addItem(offerId: string, input: OfferItemInput) {
    const totals = calculateItemPreview(input)
    const newItem = {
      id: `OFR-${offerId}-item-${nextId()}`,
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
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, items: [...o.items, newItem], updatedAt: new Date().toISOString() }
          : o
      )
    )
    recalcTotals(offerId)
    const offer = offers.find((o) => o.id === offerId)
    if (offer) {
      addAuditEntry({
        accion: 'Adición de ítem',
        entidad: 'OfferItem',
        entidadId: newItem.id,
        usuario: CURRENT_USER,
        fecha: new Date().toISOString(),
        detalle: `Ítem "${newItem.descripcion}" agregado a oferta ${offer.codigo}`,
      })
    }
  }

  function updateItem(offerId: string, itemId: string, input: Partial<OfferItemInput>) {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id !== offerId) return o
        const updatedItems = o.items.map((it) => {
          if (it.id !== itemId) return it
          const merged = { ...it, ...input }
          const totals = calculateItemPreview({
            descripcion: merged.descripcion,
            cantidad: merged.cantidad,
            valorUnitario: merged.valorUnitario,
            categoriaTributaria: merged.categoriaTributaria,
          })
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
        return { ...o, items: updatedItems, updatedAt: new Date().toISOString() }
      })
    )
    recalcTotals(offerId)
  }

  function removeItem(offerId: string, itemId: string) {
    const offer = offers.find((o) => o.id === offerId)
    const item = offer?.items.find((it) => it.id === itemId)
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, items: o.items.filter((it) => it.id !== itemId), updatedAt: new Date().toISOString() }
          : o
      )
    )
    recalcTotals(offerId)
    if (offer && item) {
      addAuditEntry({
        accion: 'Eliminación de ítem',
        entidad: 'OfferItem',
        entidadId: itemId,
        usuario: CURRENT_USER,
        fecha: new Date().toISOString(),
        detalle: `Ítem "${item.descripcion}" eliminado de oferta ${offer.codigo}`,
      })
    }
  }

  function recalcTotals(offerId: string) {
    setOffers((prev) =>
      prev.map((o) => {
        if (o.id !== offerId) return o
        const { eventTotals } = calculateEventSummary(
          o.items.map((it) => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            valorUnitario: it.valorUnitario,
            categoriaTributaria: it.categoriaTributaria,
          }))
        )
        return {
          ...o,
          subtotal: eventTotals.baseTotal,
          ivaTotal: eventTotals.ivaTotal,
          impuestoConsumoTotal: eventTotals.impuestoConsumoTotal,
          feeTarifadoTotal: eventTotals.feeTarifadoTotal,
          feeTercerosTotal: eventTotals.feeTercerosTotal,
          ivaFeeTotal: eventTotals.ivaFeeTotal,
          total: eventTotals.granTotal,
        }
      })
    )
  }

  function handleExport(offerId: string) {
    const offer = offers.find((o) => o.id === offerId)
    if (!offer) return
    exportOfferToExcel(offer)
    addAuditEntry({
      accion: 'Exportación de oferta',
      entidad: 'Offer',
      entidadId: offerId,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Oferta ${offer.codigo} exportada a Excel`,
    })
  }

  return {
    offers: filteredOffers,
    allOffers: offers,
    search,
    setSearch,
    getOffer,
    createOffer,
    updateOffer,
    changeState,
    addItem,
    updateItem,
    removeItem,
    exportOffer: handleExport,
  }
}
