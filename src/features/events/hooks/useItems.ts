import { useState, useMemo, useEffect, useRef } from 'react'
import type { ItemInput, ItemTotals, EventTotals, CalculationParams } from '../../../types'
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
    nombre: item.nombre,
    descripcion: item.descripcion,
    unidadMedida: item.unidadMedida,
    cantidad: item.cantidad,
    valorUnitario: item.valorUnitario,
    categoriaTributaria: item.categoriaTributaria,
    aliadoId: item.aliadoId,
    tariffId: item.tariffId,
    isTariffed: item.isTariffed,
  }
}

function toStored(input: ItemInput): StoredItem {
  return { ...input, id: generateId() }
}

function toManaged(list: StoredItem[], params: CalculationParams): ManagedItem[] {
  return list.map((item) => ({ ...item, totals: calculateItemPreview(toInput(item), params) }))
}

export function useItems(initialItems?: ItemInput[]) {
  const params = useActiveCalculationParams()
  const [items, setItems] = useState<StoredItem[]>(
    () => initialItems?.map(toStored) ?? [],
  )

  const itemsRef = useRef<StoredItem[]>(items)

  const baselineRef = useRef<string>(JSON.stringify(initialItems ?? []))

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    const serialized = JSON.stringify(initialItems ?? [])
    if (baselineRef.current === serialized) return
    baselineRef.current = serialized
    setItems((initialItems ?? []).map(toStored))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialItems ?? [])])

  function addItem(item: ItemInput): ManagedItem[] {
    const next = [...itemsRef.current, { ...item, id: generateId() }]
    itemsRef.current = next
    setItems(next)
    return toManaged(next, params)
  }

  function updateItem(id: string, updates: Partial<ItemInput>): ManagedItem[] {
    const next = itemsRef.current.map((item) => {
      if (item.id !== id) return item
      return { ...item, ...updates }
    })
    itemsRef.current = next
    setItems(next)
    return toManaged(next, params)
  }

  function removeItem(id: string): ManagedItem[] {
    const next = itemsRef.current.filter((item) => item.id !== id)
    itemsRef.current = next
    setItems(next)
    return toManaged(next, params)
  }

  const managedItems = useMemo<ManagedItem[]>(() => toManaged(items, params), [items, params])

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
