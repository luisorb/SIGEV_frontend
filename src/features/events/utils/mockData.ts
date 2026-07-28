import type { Ally, Disbursement, Municipality, Event, Item } from '../../../types'

export const mockAliados: Ally[] = [
  { id: '1', nombre: 'Fundación Social', nit: '900.123.456-7', contacto: 'Carlos Pérez', email: 'carlos@fsocial.org', telefono: '3001234567', activo: true },
  { id: '2', nombre: 'Corporación Desarrollo', nit: '900.789.012-3', contacto: 'Ana Gómez', email: 'ana@codesarrollo.org', telefono: '3007890123', activo: true },
  { id: '3', nombre: 'Asociación Cultural', nit: '900.345.678-9', contacto: 'Luis Rojas', email: 'luis@acultural.org', telefono: '3003456789', activo: true },
]

export const mockDesembolsos: Disbursement[] = [
  { id: '1', nombre: 'Desembolso 2025-01', codigo: 'D2025-01', porcentajeParticipacion: 40, activo: true },
  { id: '2', nombre: 'Desembolso 2025-02', codigo: 'D2025-02', porcentajeParticipacion: 35, activo: true },
  { id: '3', nombre: 'Desembolso 2025-03', codigo: 'D2025-03', porcentajeParticipacion: 25, activo: true },
]

export const mockMunicipios: Municipality[] = [
  { id: '1', nombre: 'Bogotá D.C.', departamento: 'Cundinamarca' },
  { id: '2', nombre: 'Medellín', departamento: 'Antioquia' },
  { id: '3', nombre: 'Cali', departamento: 'Valle del Cauca' },
  { id: '4', nombre: 'Barranquilla', departamento: 'Atlántico' },
  { id: '5', nombre: 'Cartagena', departamento: 'Bolívar' },
  { id: '6', nombre: 'Bucaramanga', departamento: 'Santander' },
  { id: '7', nombre: 'Pereira', departamento: 'Risaralda' },
  { id: '8', nombre: 'Manizales', departamento: 'Caldas' },
]

function generateMockItems(eventId: string, count: number): Item[] {
  const categories = ['IVA', 'Consumo', 'Tercero', 'Reembolso'] as const
  const descriptions = [
    'Servicio de logística',
    'Alquiler de equipos',
    'Transporte de materiales',
    'Honorarios profesionales',
    'Material promocional',
    'Alimentación participantes',
  ]

  return Array.from({ length: count }, (_, i) => {
    const cat = categories[i % categories.length]
    const qty = Math.floor(Math.random() * 20) + 1
    const unitVal = (Math.floor(Math.random() * 50) + 5) * 10000
    const base = qty * unitVal
    const iva = cat === 'IVA' ? base * 0.19 : 0
    const impConsumo = cat === 'Consumo' ? base * 0.08 : 0
    const feeTar = (cat === 'IVA' || cat === 'Consumo') ? base * 0.05 : 0
    const feeTer = (cat === 'Tercero' || cat === 'Reembolso') ? base * 0.10 : 0
    const feeTotal = feeTar + feeTer
    const ivaFee = feeTotal * 0.19

    return {
      id: `${eventId}-item-${i + 1}`,
      eventoId: eventId,
      descripcion: descriptions[i % descriptions.length],
      cantidad: qty,
      valorUnitario: unitVal,
      categoriaTributaria: cat,
      base,
      iva,
      impuestoConsumo: impConsumo,
      feeTarifado: feeTar,
      feeTerceros: feeTer,
      ivaFee,
      total: base + iva + impConsumo + feeTotal + ivaFee,
    }
  })
}

export const mockEvents: Event[] = [
  {
    id: 'EVT-001',
    numeroEvento: '2025-001',
    sufijo: 'A',
    responsable: 'María Torres',
    municipioId: '1',
    aliadoId: '1',
    desembolsoId: '1',
    esquema: 'cotizacion',
    estado: 'Abierto',
    items: generateMockItems('EVT-001', 3),
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'EVT-002',
    numeroEvento: '2025-002',
    sufijo: 'B',
    responsable: 'Juan García',
    municipioId: '2',
    aliadoId: '1',
    desembolsoId: '1',
    esquema: 'detalle',
    estado: 'En ejecucion',
    items: generateMockItems('EVT-002', 4),
    createdAt: '2025-02-20T14:30:00Z',
    updatedAt: '2025-03-10T09:00:00Z',
  },
  {
    id: 'EVT-003',
    numeroEvento: '2025-003',
    sufijo: '',
    responsable: 'Ana Martínez',
    municipioId: '3',
    aliadoId: '2',
    desembolsoId: '2',
    esquema: 'cotizacion',
    estado: 'Ejecutado',
    items: generateMockItems('EVT-003', 5),
    createdAt: '2025-03-05T08:00:00Z',
    updatedAt: '2025-04-20T16:00:00Z',
  },
  {
    id: 'EVT-004',
    numeroEvento: '2025-004',
    sufijo: '',
    responsable: 'Carlos López',
    municipioId: '5',
    aliadoId: '3',
    desembolsoId: '3',
    esquema: 'detalle',
    estado: 'Cerrado',
    items: generateMockItems('EVT-004', 2),
    createdAt: '2025-04-10T11:00:00Z',
    updatedAt: '2025-06-01T13:00:00Z',
  },
  {
    id: 'EVT-005',
    numeroEvento: '2025-005',
    sufijo: 'C',
    responsable: 'Laura Sánchez',
    municipioId: '4',
    aliadoId: '2',
    desembolsoId: '2',
    esquema: 'cotizacion',
    estado: 'Legalizado',
    items: generateMockItems('EVT-005', 6),
    createdAt: '2025-05-01T09:00:00Z',
    updatedAt: '2025-07-15T10:00:00Z',
  },
  {
    id: 'EVT-006',
    numeroEvento: '2025-006',
    sufijo: '',
    responsable: 'Pedro Ramírez',
    municipioId: '6',
    aliadoId: '1',
    desembolsoId: '1',
    esquema: 'detalle',
    estado: 'Abierto',
    items: generateMockItems('EVT-006', 3),
    createdAt: '2025-06-10T07:30:00Z',
    updatedAt: '2025-06-10T07:30:00Z',
  },
  {
    id: 'EVT-007',
    numeroEvento: '2025-007',
    sufijo: 'A',
    responsable: 'Diana Castro',
    municipioId: '7',
    aliadoId: '3',
    desembolsoId: '3',
    esquema: 'cotizacion',
    estado: 'En ejecucion',
    items: generateMockItems('EVT-007', 4),
    createdAt: '2025-06-20T12:00:00Z',
    updatedAt: '2025-07-01T08:00:00Z',
  },
  {
    id: 'EVT-008',
    numeroEvento: '2025-008',
    sufijo: '',
    responsable: 'María Torres',
    municipioId: '8',
    aliadoId: '2',
    desembolsoId: '1',
    esquema: 'detalle',
    estado: 'Abierto',
    items: generateMockItems('EVT-008', 2),
    createdAt: '2025-07-05T15:00:00Z',
    updatedAt: '2025-07-05T15:00:00Z',
  },
]
