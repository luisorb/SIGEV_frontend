import type { CalculationParams } from '../../../types'

export interface ParamVersion {
  id: string
  version: number
  params: CalculationParams
  aprobadoPor: string
  fechaInicio?: string
  fechaFin?: string
  fechaCreacion: string
  activo: boolean
}

export type ParamFieldKey = 'ivaRate' | 'impuestoConsumoRate' | 'feeTarifadoRate' | 'feeTercerosRate' | 'ivaFeeRate'

export interface ParamFieldDef {
  key: ParamFieldKey | 'applyFeeOnBase'
  label: string
  description: string
  type: 'percent' | 'boolean'
}
