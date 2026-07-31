import type { EventState } from '../../../types'

export const KANBAN_COLUMNS: EventState[] = [
  'Postulado',
  'En preparación',
  'En revisión',
  'En ejecución',
  'Cerrado',
  'Legalizado',
  'Devuelto',
  'Rechazado',
]

export interface StateChangeRequest {
  eventId: string
  from: EventState
  to: EventState
}

export interface KanbanGrouped {
  [key: string]: KanbanCardData[]
}

export interface KanbanCardData {
  id: string
  numeroEvento: string
  sufijo: string
  responsable: string
  municipioId: string
  aliadoId: string
  desembolsoId: string
  estado: EventState
  itemCount: number
  totalEconomico: number
}
