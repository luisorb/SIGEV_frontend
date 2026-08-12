import { Building2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { ConsolidadoRow } from '../types'
import { formatCurrencyCO } from '../../../utils/formatters'

const COLORS = ['#22C55E', '#EAB308', '#f43340', '#6366F1', '#F97316', '#EC4899']

interface ConsolidadoAliadoProps {
  rows: ConsolidadoRow[]
}

interface TooltipPayloadItem {
  payload: ConsolidadoRow
  value: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="text-slate-600">Valor: {formatCurrencyCO(d.valorTotal)}</p>
      <p className="text-slate-600">Eventos: {d.cantidadEventos}</p>
      <p className="text-slate-600">FEE: {formatCurrencyCO(d.feeTotal)}</p>
    </div>
  )
}

export function ConsolidadoAliado({ rows }: ConsolidadoAliadoProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Building2 className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Ejecución por Aliado</h3>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={rows.length * 60 + 40}>
            <BarChart data={rows} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="nombre"
                tick={{ fontSize: 11, fill: '#475569' }}
                width={120}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="valorTotal" radius={[0, 4, 4, 0]} barSize={24}>
                {rows.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {rows.map((row, i) => (
              <div key={row.id} className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-500">{row.cantidadEventos} eventos</span>
                </div>
                <span className="font-medium text-slate-900">{formatCurrencyCO(row.valorTotal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
