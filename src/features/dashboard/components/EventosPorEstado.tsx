import { Activity } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { EstadoRow } from '../types'

const STATE_COLORS: Record<string, string> = {
  Abierto: '#eab308',
  'En ejecución': '#f43340',
  Ejecutado: '#22c55e',
  Cerrado: '#64748B',
  Legalizado: '#3b82f6',
  Devuelto: '#f97316',
  Cancelado: '#8b5cf6',
}

interface EventosPorEstadoProps {
  rows: EstadoRow[]
}

interface TooltipPayloadItem {
  payload: EstadoRow
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-slate-900">{d.estado}</p>
      <p className="text-slate-600">Eventos: {d.cantidadEventos}</p>
    </div>
  )
}

export function EventosPorEstado({ rows }: EventosPorEstadoProps) {
  const totalEventos = rows.reduce((sum, r) => sum + r.cantidadEventos, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Activity className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Eventos por estado</h3>
        <span className="text-xs text-slate-500 ml-auto">{totalEventos} evento(s)</span>
      </div>
      {totalEventos === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rows} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
              <defs>
                {Object.values(STATE_COLORS).map((color, i) => (
                  <linearGradient key={i} id={`estadoGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="50%" stopColor={color} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="estado"
                interval={0}
                angle={-24}
                textAnchor="end"
                height={64}
                tick={{ fontSize: 10, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={34}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="cantidadEventos" radius={[4, 4, 0, 0]} barSize={26}>
                {rows.map((row, i) => {
                  const colorIdx = Object.keys(STATE_COLORS).indexOf(row.estado)
                  return (
                    <Cell key={row.estado} fill={`url(#estadoGrad-${colorIdx >= 0 ? colorIdx : i % Object.values(STATE_COLORS).length})`} />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
