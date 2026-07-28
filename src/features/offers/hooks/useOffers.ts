import { useState, useMemo, useRef } from 'react'
import type { Offer, OfferInput, OfferItemInput, OfferState } from '../types'
import { mockOffers } from '../utils/mockOffers'
import { calculateItemPreview, calculateEventSummary } from '../../../utils/calculationEngine'

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
        o.cliente.toLowerCase().includes(q)
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
    return newOffer
  }

  function updateOffer(id: string, input: Partial<OfferInput>) {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, ...input, updatedAt: new Date().toISOString() } : o
      )
    )
  }

  function changeState(id: string, estado: OfferState) {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, estado, updatedAt: new Date().toISOString() } : o))
    )
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
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerId
          ? { ...o, items: o.items.filter((it) => it.id !== itemId), updatedAt: new Date().toISOString() }
          : o
      )
    )
    recalcTotals(offerId)
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
  }
}
