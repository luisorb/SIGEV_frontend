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
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1.5">
      <p className="font-semibold text-slate-900">{label ?? d.mes}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="text-slate-600">Eventos: <span className="font-medium text-slate-900">{d.cantidadEventos}</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-slate-600">Valor: <span className="font-medium text-slate-900">{formatCurrencyCO(d.valorTotal)}</span></span>
      </div>
    </div>
  )
}

function ActiveDot(props: Record<string, unknown>) {
  const { cx, cy } = props as { cx?: number; cy?: number }
  if (cx == null || cy == null) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#10b981" opacity={0.15} />
      <circle cx={cx} cy={cy} r={3.5} fill="#10b981" stroke="#fff" strokeWidth={2} />
    </g>
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
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
              <Bar
                yAxisId="eventos"
                dataKey="cantidadEventos"
                name="Eventos"
                barSize={18}
                radius={[4, 4, 0, 0]}
                fill="#818cf8"
              />
              <Area
                yAxisId="valor"
                type="monotone"
                dataKey="valorTotal"
                name="Valor"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#fillValorTemporal)"
                dot={<ActiveDot />}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: '#10b981' }} />
              Valor total por mes
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: '#818cf8' }} />
              Eventos registrados
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
