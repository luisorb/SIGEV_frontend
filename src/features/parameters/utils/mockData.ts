import type { ParamVersion } from '../types'

export const mockParamVersions: ParamVersion[] = [
  {
    id: 'pv-001',
    version: 1,
    params: {
      ivaRate: 0.16,
      impuestoConsumoRate: 0.06,
      feeTarifadoRate: 0.04,
      feeTercerosRate: 0.08,
      ivaFeeRate: 0.16,
      applyFeeOnBase: false,
      paramsVersion: '1.0',
    },
    aprobadoPor: 'Admin SIGEV',
    fechaCreacion: '2024-06-01T00:00:00.000Z',
    activo: false,
  },
  {
    id: 'pv-002',
    version: 2,
    params: {
      ivaRate: 0.19,
      impuestoConsumoRate: 0.08,
      feeTarifadoRate: 0.05,
      feeTercerosRate: 0.10,
      ivaFeeRate: 0.19,
      applyFeeOnBase: true,
      paramsVersion: '2.0',
    },
    aprobadoPor: 'Admin SIGEV',
    fechaCreacion: '2025-01-15T00:00:00.000Z',
    activo: true,
  },
]
