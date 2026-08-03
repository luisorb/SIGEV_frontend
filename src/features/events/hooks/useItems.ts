import { useState, useMemo } from 'react'
import type { ItemInput, ItemTotals, EventTotals } from '../../../types'
import { calculateItemPreview, calculateEventSummary } from '../../../utils/calculationEngine'
import { useActiveCalculationParams } from '../../../hooks/useActiveCalculationParams'

export interface ManagedItem extends ItemInput {
  id: string
  totals: ItemTotals
}

interface StoredItem extends ItemInput {
  id: string
}

let nextId = 1
function generateId() {
  return `item-${nextId++}`
}

function toInput(item: StoredItem): ItemInput {
  return {
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    valorUnitario: item.valorUnitario,
    categoriaTributaria: item.categoriaTributaria,
    aliadoId: item.aliadoId,
  }
}

export function useItems(initialItems?: ItemInput[]) {
  const params = useActiveCalculationParams()
  const [items, setItems] = useState<StoredItem[]>(
    () =>
      initialItems?.map((item) => ({
        ...item,
        id: generateId(),
      })) ?? [],
  )

  function addItem(item: ItemInput) {
    setItems((prev) => [
      ...prev,
      { ...item, id: generateId() },
    ])
  }

  function updateItem(id: string, updates: Partial<ItemInput>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return { ...item, ...updates }
      }),
    )
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const managedItems = useMemo<ManagedItem[]>(
    () => items.map((item) => ({ ...item, totals: calculateItemPreview(toInput(item), params) })),
    [items, params],
  )

  const itemsInput = useMemo<ItemInput[]>(() => items.map(toInput), [items])

  const summary = useMemo(() => calculateEventSummary(itemsInput, params), [itemsInput, params])

  const eventTotals: EventTotals = summary.eventTotals

  return {
    items: managedItems,
    addItem,
    updateItem,
    removeItem,
    eventTotals,
    summary,
  }
}
