import type { Ally, Disbursement, Municipality } from '../../../types'

export interface EventListFilters {
  search: string
  estado: string
  aliadoId: string
  desembolsoId: string
  municipioId: string
}

export interface EventListSort {
  column: string
  direction: 'asc' | 'desc'
}

export interface EventListMeta {
  total: number
  filtered: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SelectOption {
  value: string
  label: string
}

export interface EventListData {
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
}
