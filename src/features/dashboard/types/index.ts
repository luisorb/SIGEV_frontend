export interface DashboardFiltersState {
  periodoInicio: string
  periodoFin: string
  desembolsoId: string
  aliadoId: string
  estado: string
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
