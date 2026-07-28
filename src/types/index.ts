export type TaxCategory = 'IVA' | 'Consumo' | 'Tercero' | 'Reembolso'

export type EventState = 'Abierto' | 'En ejecucion' | 'Ejecutado' | 'Cerrado' | 'Legalizado'

export type SchemaType = 'cotizacion' | 'detalle'

export type UserRole = 'Administrador' | 'Operador' | 'Supervisor' | 'Consulta' | 'Auditor'

export interface Ally {
  id: string
  nombre: string
  nit: string
  contacto: string
  email: string
  telefono: string
  color: string
  activo: boolean
}

export interface Disbursement {
  id: string
  nombre: string
  codigo: string
  porcentajeParticipacion: number
  vigencia: string
  valorReferencia: number
  activo: boolean
}

export interface Municipality {
  id: string
  nombre: string
  departamento: string
  vereda?: string
}

export interface Item {
  id: string
  eventoId: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
  aliadoId?: string
  base: number
  iva: number
  impuestoConsumo: number
  feeTarifado: number
  feeTerceros: number
  ivaFee: number
  total: number
}

export interface ItemInput {
  descripcion: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
  aliadoId?: string
}

export interface CalculationParam {
  id: string
  tipo: 'iva' | 'consumo' | 'feeTarifado' | 'feeTerceros' | 'ivaFee'
  valor: number
  vigenciaInicio: string
  vigenciaFin: string
  version: number
  aprobadoPor: string
  activo: boolean
}

export interface CalculationParams {
  ivaRate: number
  impuestoConsumoRate: number
  feeTarifadoRate: number
  feeTercerosRate: number
  ivaFeeRate: number
  applyFeeOnBase: boolean
  paramsVersion?: string
}

export interface FeeCalculation {
  feeTarifado: number
  feeTerceros: number
  feeTotal: number
  ivaFee: number
}

export interface ItemTotals {
  base: number
  iva: number
  impuestoConsumo: number
  impuestos: number
  feeTarifado: number
  feeTerceros: number
  feeTotal: number
  ivaFee: number
  totalSinRetenciones: number
  total: number
}

export interface EventTotals {
  baseTotal: number
  ivaTotal: number
  impuestoConsumoTotal: number
  impuestosTotal: number
  feeTarifadoTotal: number
  feeTercerosTotal: number
  feeTotal: number
  ivaFeeTotal: number
  totalSinRetenciones: number
  granTotal: number
  cantidadItems: number
}

export interface CalculationSummary {
  itemTotals: ItemTotals[]
  eventTotals: EventTotals
}

export interface Event {
  id: string
  numeroEvento: string
  sufijo: string
  responsable: string
  dependencia: string
  fechaEvento: string
  asistentes: number
  dias: number
  municipioId: string
  vereda: string
  latitud?: number
  longitud?: number
  observaciones: string
  aliadoId: string
  desembolsoId: string
  esquema: SchemaType
  estado: EventState
  items: Item[]
  activo?: boolean
  eliminadoAt?: string
  createdAt: string
  updatedAt: string
}

export interface EventInput {
  numeroEvento: string
  sufijo?: string
  responsable: string
  dependencia?: string
  fechaEvento?: string
  asistentes?: number
  dias?: number
  municipioId: string
  vereda?: string
  latitud?: number
  longitud?: number
  observaciones?: string
  aliadoId: string
  desembolsoId: string
  esquema: SchemaType
  estado?: EventState
}

export interface AuditEntry {
  id: string
  usuario: string
  accion: string
  entidad: string
  entidadId: string
  detalle: string
  valorAnterior?: string
  valorNuevo?: string
  fecha: string
  origen?: string
}

export interface StateHistoryEntry {
  id: string
  eventoId: string
  estadoAnterior: EventState
  estadoNuevo: EventState
  usuario: string
  fecha: string
  motivo: string
}
