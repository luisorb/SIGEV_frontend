import type { EventState } from '../../../types'

export interface DashboardFiltersState {
  periodoInicio: string
  periodoFin: string
  desembolsoId: string
  aliadoId: string
  estado: string
  municipioId: string
  dependencia: string
  programa: string
  instanciaParticipacion: string
}

export interface DashboardMetrics {
  valorTotalEjecutado: number
  numeroPagos: number
}

export interface ConsolidadoRow {
  id: string
  nombre: string
  cantidadEventos: number
  valorTotal: number
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

export interface EstadoRow {
  estado: EventState
  cantidadEventos: number
  valorTotal: number
}

export interface TendenciaMes {
  key: string
  mes: string
  label?: string
  cantidadEventos: number
  valorTotal: number
}

export interface DashboardSectionRefs {
  eventosIncompletos: React.RefObject<HTMLDivElement | null>
  eventosPorEstado: React.RefObject<HTMLDivElement | null>
  consolidadoDesembolso: React.RefObject<HTMLDivElement | null>
  consolidadoAliado: React.RefObject<HTMLDivElement | null>
  evolucionTemporal: React.RefObject<HTMLDivElement | null>
  recentOrders: React.RefObject<HTMLDivElement | null>
  coberturaTerritorial: React.RefObject<HTMLDivElement | null>
}
