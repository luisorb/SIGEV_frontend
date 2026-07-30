export interface DashboardFiltersState {
  periodoInicio: string
  periodoFin: string
  desembolsoId: string
  aliadoId: string
  estado: string
  municipioId: string
  dependencia: string
}

export interface DashboardMetrics {
  valorTotalEjecucion: number
  numeroEventos: number
  baseMasImpuestos: number
  feeAcumulado: number
  impuestosAcumulados: number
}

export interface ConsolidadoRow {
  id: string
  nombre: string
  cantidadEventos: number
  valorTotal: number
  feeTotal: number
  porcentaje: number
}

export interface CoberturaItem {
  municipioId: string
  municipio: string
  departamento: string
  cantidadEventos: number
  valorTotal: number
  porcentaje: number
}

export interface EventoIncompleto {
  id: string
  numeroEvento: string
  sufijo: string
  responsable: string
  motivo: string
}
