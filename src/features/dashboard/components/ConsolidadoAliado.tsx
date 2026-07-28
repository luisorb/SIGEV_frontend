import { Building2 } from 'lucide-react'
import type { ConsolidadoRow } from '../types'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'

interface ConsolidadoAliadoProps {
  rows: ConsolidadoRow[]
}

export function ConsolidadoAliado({ rows }: ConsolidadoAliadoProps) {
  const maxValor = rows.length > 0 ? rows[0].valorTotal : 1

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Building2 className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Ejecución por Aliado</h3>
        <span className="text-xs text-slate-500 ml-auto">{rows.length} aliado(s)</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.id} className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">{row.nombre}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrencyCO(row.valorTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{row.cantidadEventos} evento{row.cantidadEventos !== 1 ? 's' : ''}</span>
                <span>Fee: {formatCurrencyCO(row.feeTotal)}</span>
                <span>{formatPercentage(row.porcentaje)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(row.valorTotal / maxValor) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
