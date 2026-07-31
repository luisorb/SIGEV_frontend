import type { CalculationParams } from '../types'

export const DEFAULT_CALCULATION_PARAMS: CalculationParams = {
  ivaRate: 0,
  impuestoConsumoRate: 0,
  feeTarifadoRate: 0,
  feeTercerosRate: 0,
  ivaFeeRate: 0,
  applyFeeOnBase: false,
  paramsVersion: '',
}

export const TAX_CATEGORIES = ['IVA', 'Consumo', 'Tercero', 'Reembolso'] as const

export const EVENT_STATES = [
  'Postulado',
  'En preparación',
  'En revisión',
  'En ejecución',
  'Cerrado',
  'Legalizado',
  'Devuelto',
  'Rechazado',
] as const

export const EVENT_SCHEMAS = ['cotizacion', 'detalle'] as const

export const USER_ROLES = [
  'technical_admin',
  'functional_admin',
  'approver',
  'operator',
  'solicitante',
  'analista',
  'supervisor',
  'auditor',
  'consulta',
] as const

export const LOCAL_CONFIG = {
  locale: 'es-CO',
  timeZone: 'America/Bogota',
  currency: 'COP',
} as const

export function getCurrentUser(): string {
  try {
    const saved = sessionStorage.getItem('sigev-auth')
    if (saved) {
      const parsed = JSON.parse(saved) as { nombre: string }
      return parsed.nombre
    }
  } catch { /* fall through */ }
  return ''
}
