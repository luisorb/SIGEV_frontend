import { Banknote } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { ConsolidadoRow } from '../types'
import type { PaymentSummaryRow } from '../../../services/payments.service'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'
const COLORS = ['#f43340', '#EAB308', '#22C55E', '#6366F1', '#F97316', '#EC4899']

interface ConsolidadoDesembolsoProps {
  rows: ConsolidadoRow[]
  paymentSummary?: PaymentSummaryRow[]
}

interface TooltipPayloadItem {
  payload: ConsolidadoRow
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-slate-900">{d.nombre}</p>
      <p className="text-slate-600">Valor: {formatCurrencyCO(d.valorTotal)}</p>
      <p className="text-slate-600">Eventos: {d.cantidadEventos}</p>
      <p className="text-slate-600">FEE: {formatCurrencyCO(d.feeTotal)}</p>
      <p className="text-slate-600">Participación: {formatPercentage(d.porcentaje)}</p>
    </div>
  )
}

export function ConsolidadoDesembolso({ rows, paymentSummary = [] }: ConsolidadoDesembolsoProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Banknote className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Ejecución por recurso disponible</h3>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={rows}
                dataKey="valorTotal"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                strokeWidth={0}
              >
                {rows.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-3">
            {rows.map((row, i) => (
              <div key={row.id} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-slate-600">{row.nombre}</span>
                <span className="font-medium text-slate-900">{formatPercentage(row.porcentaje)}</span>
              </div>
            ))}
          </div>

          {paymentSummary.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4 space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Indicadores por recurso disponible (≤100%)
              </p>
              {paymentSummary.map((row) => {
                const pctEjecucion = row.porcentajeEjecucion ?? row.percentage * 100
                const pctParticipacion = row.porcentajeParticipacion ?? 0
                return (
                  <div key={row.disbursementId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        {row.name}
                      </span>
                      <span className="text-slate-500">
                        {formatCurrencyCO(row.paid)} de {formatCurrencyCO(row.amount)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400">% Ejecución financiera</span>
                        <span className="font-semibold text-slate-700">
                          {formatPercentage(Math.min(1, pctEjecucion / 100))}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, pctEjecucion))}%`,
                            backgroundColor: pctEjecucion > 100 ? '#f43340' : '#22C55E',
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400">% Participación de eventos</span>
                        <span className="font-semibold text-slate-700">
                          {formatPercentage(Math.min(1, pctParticipacion / 100))}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, pctParticipacion))}%`,
                            backgroundColor: pctParticipacion > 100 ? '#f43340' : '#6366F1',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
