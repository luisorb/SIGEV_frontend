import { TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { TendenciaMes } from '../types'
import { formatCurrencyCO, formatCurrencyCOCompact } from '../../../utils/formatters'

interface EvolucionTemporalProps {
  rows: TendenciaMes[]
}

interface TooltipPayloadItem {
  payload: TendenciaMes
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1.5">
      <p className="font-semibold text-slate-900">{d.label ?? d.mes}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-slate-600">Eventos: <span className="font-medium text-slate-900">{d.cantidadEventos}</span></span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-700" />
        <span className="text-slate-600">Valor: <span className="font-medium text-slate-900">{formatCurrencyCO(d.valorTotal)}</span></span>
      </div>
    </div>
  )
}

export function EvolucionTemporal({ rows }: EvolucionTemporalProps) {
  const totalEventos = rows.reduce((sum, r) => sum + r.cantidadEventos, 0)
  const totalValor = rows.reduce((sum, r) => sum + r.valorTotal, 0)
  const now = new Date()
  const monthName = now.toLocaleDateString('es-CO', { month: 'long' })
  const year = now.getFullYear()

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <TrendingUp className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Actividad mensual</h3>
        <span className="text-xs text-slate-500 ml-auto capitalize">{monthName} {year}</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{totalEventos}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Eventos</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatCurrencyCOCompact(totalValor)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Valor total</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43340" stopOpacity={1} />
                  <stop offset="50%" stopColor="#e85d6a" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="key"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval={rows.length > 15 ? 4 : rows.length > 7 ? 2 : 0}
              />
              <YAxis
                tickFormatter={formatCurrencyCOCompact}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} />
              <Bar dataKey="valorTotal" radius={[3, 3, 0, 0]} barSize={rows.length > 15 ? 8 : 16}>
                {rows.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.valorTotal > 0 ? 'url(#barGradient)' : '#e2e8f0'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-red-500" />
              Valor por d&iacute;a
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: '#e2e8f0' }} />
              Sin datos
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
