import { Activity } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { EstadoRow } from '../types'

const STATE_COLORS: Record<string, string> = {
  Abierto: '#EAB308',
  'En ejecución': '#3B82F6',
  Ejecutado: '#F97316',
  Cerrado: '#64748B',
  Legalizado: '#A855F7',
  Devuelto: '#D97706',
  Cancelado: '#F43F5E',
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
                {rows.map((row) => (
                  <Cell key={row.estado} fill={STATE_COLORS[row.estado] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
