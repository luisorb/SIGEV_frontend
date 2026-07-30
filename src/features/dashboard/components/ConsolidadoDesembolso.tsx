import { Banknote } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { ConsolidadoRow } from '../types'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'
const COLORS = ['#f43340', '#EAB308', '#22C55E', '#6366F1', '#F97316', '#EC4899']

interface ConsolidadoDesembolsoProps {
  rows: ConsolidadoRow[]
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
      <p className="text-slate-600">Fee: {formatCurrencyCO(d.feeTotal)}</p>
      <p className="text-slate-600">Part.: {formatPercentage(d.porcentaje)}</p>
    </div>
  )
}

export function ConsolidadoDesembolso({ rows }: ConsolidadoDesembolsoProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Banknote className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Ejecución por Desembolso</h3>
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
        </div>
      )}
    </div>
  )
}
