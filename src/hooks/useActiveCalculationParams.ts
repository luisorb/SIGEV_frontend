import { useQuery } from '@tanstack/react-query'
import type { CalculationParams } from '../types'
import { DEFAULT_CALCULATION_PARAMS } from '../config/constants'
import { getActiveParametersApi } from '../services/parameters.service'

// Los parámetros de cálculo cambian muy rara vez; 30 min evita pedirlos en
// cada montaje. useParameters invalida esta clave al guardar una versión.
export const ACTIVE_PARAMS_KEY = ['parameters', 'active'] as const

export function useActiveCalculationParams(): CalculationParams {
  const { data } = useQuery({
    queryKey: ACTIVE_PARAMS_KEY,
    queryFn: getActiveParametersApi,
    staleTime: 30 * 60_000,
  })

  if (!data) return DEFAULT_CALCULATION_PARAMS

  return {
    ivaRate: data.ivaRate,
    impuestoConsumoRate: data.impuestoConsumoRate,
    feeTarifadoRate: data.feeTarifadoRate,
    feeTercerosRate: data.feeTercerosRate,
    ivaFeeRate: data.ivaFeeRate,
    applyFeeOnBase: data.applyFeeOnBase,
    paramsVersion: data.paramsVersion ?? `${data.version}.0`,
  }
}
