export interface ValuatedItem {
  valorUnitario?: number
}

export function hasQuotedValues(items: readonly ValuatedItem[]): boolean {
  return items.length > 0 && items.every((item) => Number(item.valorUnitario ?? 0) > 0)
}
