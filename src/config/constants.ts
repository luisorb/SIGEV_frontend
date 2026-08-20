import type { CalculationParams } from '../types'

export const DEFAULT_CALCULATION_PARAMS: CalculationParams = {
  ivaRate: 0.19,
  impuestoConsumoRate: 0.08,
  feeTarifadoRate: 0.0825,
  feeTercerosRate: 0.0825,
  ivaFeeRate: 0.19,
  applyFeeOnBase: true,
  paramsVersion: '',
}

export const TAX_CATEGORIES = ['IVA', 'Consumo', 'Tercero', 'Reembolso'] as const

export const EVENT_STATES = [
  'Abierto',
  'En ejecución',
  'Ejecutado',
  'Cerrado',
  'Legalizado',
  'Devuelto',
  'Cancelado',
] as const

export const EVENT_SCHEMAS = ['cotizacion', 'detalle'] as const

export const DEPENDENCIAS = ['Territorial'] as const

export const PROGRAMAS = ['RENHACEMOS', 'PNIS', 'OTROS'] as const

export type Programa = (typeof PROGRAMAS)[number]

export const INSTANCIAS_PARTICIPACION: Record<Exclude<Programa, 'OTROS'>, readonly string[]> = {
  RENHACEMOS: [
    'VISITA ATI A BENEFICIARIOS',
    'LEVANTAMIENTO DE POLÍGONOS',
    'LEVANTAMIENTO LÍNEA BASE',
    'JORNADA DE INSCRIPCIÓN',
    'OLLA COMUNITARIA',
    'CUÑAS Y DIFUSIÓN',
    'FERIA DE PROVEEDORES',
    'MESA DE TRABAJO',
    'MESA INTERINSTITUCIONAL',
    'PLAN DE INVERSIÓN',
    'ASAMBLEA COMUNITARIA',
    'ENTREGA DE ACTIVOS PRODUCTIVOS',
    'ENTREGA DE KITS A BENEFICIARIOS',
    'ENTREGA DE MAQUINARIA AMARILLA',
  ],
  PNIS: [
    'INSTANCIAS DE PARTICIPACIÓN',
    'JORNADA DE INSCRIPCIÓN',
    'OLLA COMUNITARIA',
    'CUÑAS Y DIFUSIÓN',
    'FERIA DE PROVEEDORES',
    'MESA DE TRABAJO',
    'MESA INTERINSTITUCIONAL',
    'PLAN DE INVERSIÓN',
    'ASAMBLEA COMUNITARIA',
    'ENTREGA DE ACTIVOS PRODUCTIVOS',
    'ENTREGA DE KITS A BENEFICIARIOS',
    'ENTREGA DE MAQUINARIA AMARILLA',
  ],
} as const

export const USER_ROLES = [
  'technical_admin',
  'functional_admin',
  'approver',
  'consulta',
  'solicitante',
  'analista',
  'supervisor',
  'auditor',
  'operator',
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
