import { useState, useMemo } from 'react'
import type { ItemInput, ItemTotals, EventTotals } from '../../../types'
import { calculateItemPreview, calculateEventSummary } from '../../../utils/calculationEngine'

export interface ManagedItem extends ItemInput {
  id: string
  totals: ItemTotals
}

let nextId = 1
function generateId() {
  return `item-${nextId++}`
}

export function useItems(initialItems?: ItemInput[], _eventAliadoId?: string) {
  const [items, setItems] = useState<ManagedItem[]>(
    () =>
      initialItems?.map((item) => ({
        ...item,
        id: generateId(),
        totals: calculateItemPreview(item),
      })) ?? [],
  )

  function addItem(item: ItemInput) {
    setItems((prev) => [
      ...prev,
      { ...item, id: generateId(), totals: calculateItemPreview(item) },
    ])
  }

  function updateItem(id: string, updates: Partial<ItemInput>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, ...updates }
        return { ...updated, totals: calculateItemPreview(updated) }
      }),
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const itemsInput = useMemo<ItemInput[]>(
    () =>
      items.map((item) => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        valorUnitario: item.valorUnitario,
        categoriaTributaria: item.categoriaTributaria,
        aliadoId: item.aliadoId,
      })),
    [items],
  )

  const summary = useMemo(() => calculateEventSummary(itemsInput), [itemsInput])

  const eventTotals: EventTotals = summary.eventTotals

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    eventTotals,
    summary,
  }
}
