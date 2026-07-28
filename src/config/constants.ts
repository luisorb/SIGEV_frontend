import type { CalculationParams } from '../types'

export const DEFAULT_CALCULATION_PARAMS: CalculationParams = {
  ivaRate: 0.19,
  impuestoConsumoRate: 0.08,
  feeTarifadoRate: 0.05,
  feeTercerosRate: 0.10,
  ivaFeeRate: 0.19,
  applyFeeOnBase: true,
}

export const TAX_CATEGORIES = ['IVA', 'Consumo', 'Tercero', 'Reembolso'] as const

export const EVENT_STATES = ['Abierto', 'En ejecucion', 'Ejecutado', 'Cerrado', 'Legalizado'] as const

export const EVENT_SCHEMAS = ['cotizacion', 'detalle'] as const

export const USER_ROLES = ['Administrador', 'Operador', 'Supervisor', 'Consulta', 'Auditor'] as const

export const LOCAL_CONFIG = {
  locale: 'es-CO',
  timeZone: 'America/Bogota',
  currency: 'COP',
} as const
