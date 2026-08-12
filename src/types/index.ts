export type TaxCategory = 'IVA' | 'Consumo' | 'Tercero' | 'Reembolso'

export type RoleName =
  | 'technical_admin'
  | 'functional_admin'
  | 'approver'
  | 'operator'
  | 'solicitante'
  | 'analista'
  | 'supervisor'
  | 'auditor'
  | 'consulta'

export interface Role {
  id: string
  name: RoleName
  description: string
}

export type EventState =
  | 'Abierto'
  | 'En ejecución'
  | 'Ejecutado'
  | 'Cerrado'
  | 'Legalizado'
  | 'Devuelto'
  | 'Rechazado'

export type SchemaType = 'cotizacion' | 'detalle'

export type TipoSoporte =
  | 'Formato de requerimiento'
  | 'Cotizaciones presentadas'
  | 'Comunicado de aprobación'
  | 'Presupuesto final'
  | 'Facturas normalizadas'
  | 'Registro fotográfico'
  | 'Listado de asistencia'

export const SOPORTES_REQUERIDOS: TipoSoporte[] = [
  'Formato de requerimiento',
  'Cotizaciones presentadas',
  'Comunicado de aprobación',
  'Presupuesto final',
  'Facturas normalizadas',
  'Registro fotográfico',
  'Listado de asistencia',
]

export const SOPORTES_ESTATICOS: TipoSoporte[] = [
  'Formato de requerimiento',
  'Cotizaciones presentadas',
  'Comunicado de aprobación',
  'Presupuesto final',
]

export const SOPORTES_MODIFICABLES: TipoSoporte[] = [
  'Facturas normalizadas',
  'Registro fotográfico',
  'Listado de asistencia',
]

export interface Ally {
  id: string
  codigo: string
  nombre: string
  tipoIdentificacion: string
  numeroIdentificacion: string
  telefono: string
  correo: string
  divipolaCode: string
  divipolaDepartment: string
  contacto: string
  color: string
  activo: boolean
}

export interface Disbursement {
  id: string
  nombre: string
  codigo: string
  vigencia: string
  vigenciaInicio?: string
  vigenciaFin?: string
  valorReferencia: number
  activo: boolean
}

export interface Municipality {
  id: string
  nombre: string
  departamento: string
  vereda?: string
  lat?: number
  lng?: number
}

export interface Item {
  id: string
  eventoId: string
  nombre?: string
  descripcion: string
  unidadMedida?: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
  aliadoId?: string
  tariffId?: string
  isTariffed?: boolean
  base: number
  iva: number
  impuestoConsumo: number
  feeTarifado: number
  feeTerceros: number
  ivaFee: number
  total: number
}

export interface ItemInput {
  nombre?: string
  descripcion: string
  unidadMedida?: string
  cantidad: number
  valorUnitario: number
  categoriaTributaria: TaxCategory
  aliadoId?: string
  tariffId?: string
  isTariffed?: boolean
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
  devolucionLegalizacion?: boolean
  devueltoDesde?: string | null
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

export interface Soporte {
  id: string
  eventoId: string
  tipo: TipoSoporte
  nombre: string
  archivo: string
  tamanio: number
  mimeType: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  originalName: string
  storedPath: string
  mimeType: string
  fileSize: number
  category?: string
  eventId: string
  quotationId?: string | null
  uploadedById: string
  createdAt: string
}

export interface Quotation {
  id: string
  code: string
  name: string
  description?: string
  cliente?: string
  eventId?: string
  allyId?: string
  amount: number
  currency: string
  status: string
  isDefinitive: boolean
  createdAt: string
  updatedAt: string
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
  asignadoA?: string
  soportes?: Soporte[]
  attachments?: Attachment[]
  quotations?: Quotation[]
  cotizacionSeleccionadaId?: string
  ofertaEconomica?: {
    id: string
    total: number
    baseTotal: number
    ivaTotal: number
    impuestoConsumoTotal: number
    feeTarifadoTotal: number
    feeTercerosTotal: number
    ivaFeeTotal: number
    items?: Item[]
  }
  municipalityCategory?: string
  observation?: string
  activo?: boolean
  eliminadoAt?: string
  createdAt: string
  updatedAt: string
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
