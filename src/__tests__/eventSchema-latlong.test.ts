import { describe, it, expect } from 'vitest'
import { eventSchema } from '../features/events/schemas/eventSchema'

const base = {
  numeroEvento: '2025-001',
  sufijo: '',
  responsable: 'Test',
  dependencia: '',
  fechaEvento: '',
  asistentes: 0,
  dias: 0,
  municipioId: '1',
  vereda: '',
  observaciones: '',
  aliadoId: '1',
  desembolsoId: '1',
  esquema: 'cotizacion' as const,
  estado: 'Abierto' as const,
}

describe('eventSchema latitud/longitud', () => {
  it('acepta NaN (input vacío con valueAsNumber)', () => {
    const result = eventSchema.safeParse({ ...base, latitud: NaN, longitud: NaN })
    expect(result.success).toBe(true)
  })

  it('acepta undefined', () => {
    const result = eventSchema.safeParse({ ...base, latitud: undefined, longitud: undefined })
    expect(result.success).toBe(true)
  })

  it('acepta valores numéricos', () => {
    const result = eventSchema.safeParse({ ...base, latitud: 4.711, longitud: -74.0721 })
    expect(result.success).toBe(true)
  })
})
