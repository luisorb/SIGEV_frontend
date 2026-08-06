import { describe, it, expect } from 'vitest'
import { hasQuotedValues } from '../features/offers/utils/offerValues'

describe('hasQuotedValues', () => {
  it('retorna false para una lista vacía', () => {
    expect(hasQuotedValues([])).toBe(false)
  })

  it('retorna false cuando todos los ítems tienen valor unitario 0', () => {
    expect(
      hasQuotedValues([
        { valorUnitario: 0 },
        { valorUnitario: 0 },
      ]),
    ).toBe(false)
  })

  it('retorna false cuando al menos un ítem sigue pendiente por cotizar', () => {
    expect(
      hasQuotedValues([
        { valorUnitario: 100000 },
        { valorUnitario: 0 },
      ]),
    ).toBe(false)
  })

  it('retorna false cuando el valor unitario es undefined', () => {
    expect(hasQuotedValues([{ valorUnitario: undefined }, { valorUnitario: 250000 }])).toBe(false)
  })

  it('retorna true cuando todos los ítems tienen valor unitario positivo', () => {
    expect(
      hasQuotedValues([
        { valorUnitario: 100000 },
        { valorUnitario: 250000 },
      ]),
    ).toBe(true)
  })

  it('retorna true con un solo ítem cotizado', () => {
    expect(hasQuotedValues([{ valorUnitario: 500000 }])).toBe(true)
  })
})
