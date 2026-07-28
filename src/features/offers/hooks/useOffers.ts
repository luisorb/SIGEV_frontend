import { useState, useMemo, useRef } from 'react'
import type { Offer, OfferInput, OfferItemInput, OfferState } from '../types'
import { mockOffers } from '../utils/mockOffers'

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
    const base = input.cantidad * input.valorUnitario
    const iva = base * 0.19
    const total = base + iva
    const newItem = {
      id: `OFR-${offerId}-item-${nextId()}`,
      ofertaId: offerId,
      ...input,
      base,
      iva,
      total,
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
          merged.base = merged.cantidad * merged.valorUnitario
          merged.iva = merged.base * 0.19
          merged.total = merged.base + merged.iva
          return merged
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
        const subtotal = o.items.reduce((s, it) => s + it.base, 0)
        const ivaTotal = o.items.reduce((s, it) => s + it.iva, 0)
        const total = o.items.reduce((s, it) => s + it.total, 0)
        return { ...o, subtotal, ivaTotal, total }
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
