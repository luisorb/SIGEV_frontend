import { Landmark } from 'lucide-react'
import type { PaymentSummaryRow } from '../../../services/payments.service'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'

interface EjecucionFinancieraProps {
  paymentSummary?: PaymentSummaryRow[]
}

export function EjecucionFinanciera({ paymentSummary = [] }: EjecucionFinancieraProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Landmark className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Ejecuci&oacute;n financiera por recurso disponible</h3>
      </div>
      {paymentSummary.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {paymentSummary.map((row) => {
            const pctEjecucion = row.porcentajeEjecucion ?? row.percentage * 100
            return (
              <div key={row.disbursementId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{row.name}</span>
                  <span className="text-slate-500 tabular-nums">
                    {formatCurrencyCO(row.paid)} de {formatCurrencyCO(row.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, pctEjecucion))}%`,
                        backgroundColor: pctEjecucion > 100 ? '#dc2626' : '#22c55e',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-12 text-right tabular-nums">
                    {formatPercentage(Math.min(1, pctEjecucion / 100))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
