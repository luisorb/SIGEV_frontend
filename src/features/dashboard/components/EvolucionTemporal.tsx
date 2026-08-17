import { TrendingUp } from 'lucide-react'
import {
  ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { TendenciaMes } from '../types'
import { formatCurrencyCO, formatCurrencyCOCompact } from '../../../utils/formatters'

interface EvolucionTemporalProps {
  rows: TendenciaMes[]
}

interface TooltipPayloadItem {
  payload: TendenciaMes
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-slate-900">{label ?? d.mes}</p>
      <p className="text-slate-600">Eventos: {d.cantidadEventos}</p>
      <p className="text-slate-600">Valor: {formatCurrencyCO(d.valorTotal)}</p>
    </div>
  )
}

export function EvolucionTemporal({ rows }: EvolucionTemporalProps) {
  const totalEventos = rows.reduce((sum, r) => sum + r.cantidadEventos, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <TrendingUp className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Actividad mensual</h3>
        <span className="text-xs text-slate-500 ml-auto">{totalEventos} evento(s) · {rows.length} mes(es)</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="fillValorTemporal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43340" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#f43340" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="valor"
                tickFormatter={formatCurrencyCOCompact}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <YAxis
                yAxisId="eventos"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="eventos"
                dataKey="cantidadEventos"
                name="Eventos"
                barSize={18}
                radius={[4, 4, 0, 0]}
                fill="#E2E8F0"
              />
              <Area
                yAxisId="valor"
                type="monotone"
                dataKey="valorTotal"
                name="Valor"
                stroke="#f43340"
                strokeWidth={2.5}
                fill="url(#fillValorTemporal)"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: '#f43340' }} />
              Valor total por mes
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: '#E2E8F0' }} />
              Eventos registrados
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
