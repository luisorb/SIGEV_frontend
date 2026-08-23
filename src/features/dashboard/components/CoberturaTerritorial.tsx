import { MapPin } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CoberturaItem } from '../types'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'

const COLORS = ['#f43340', '#22c55e', '#3b82f6', '#eab308', '#f97316', '#8b5cf6', '#14b8a6', '#ec4899']

interface CoberturaTerritorialProps {
  rows: CoberturaItem[]
}

interface TooltipPayloadItem {
  payload: {
    municipio: string
    departamento: string
    valorTotal: number
    cantidadEventos: number
    porcentaje: number
  }
  value: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-slate-900">{d.municipio}</p>
      <p className="text-slate-500">{d.departamento}</p>
      <p className="text-slate-600">Pagado: {formatCurrencyCO(d.valorTotal)}</p>
      <p className="text-slate-600">Eventos: {d.cantidadEventos}</p>
      <p className="text-slate-600">Participacion: {formatPercentage(d.porcentaje)}</p>
    </div>
  )
}

export function CoberturaTerritorial({ rows }: CoberturaTerritorialProps) {
  const data = rows.map((r) => ({
    name: r.municipio,
    municipio: r.municipio,
    departamento: r.departamento,
    cantidadEventos: r.cantidadEventos,
    valorTotal: r.valorTotal,
    porcentaje: r.porcentaje,
  }))

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <MapPin className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Cobertura Territorial</h3>
        <span className="text-xs text-slate-500 ml-auto">Valores pagados &middot; {rows.length} municipio(s)</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                dataKey="valorTotal"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="68%"
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
            {rows.map((row, i) => (
              <div key={row.municipioId} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-slate-600">{row.municipio}</span>
                <span className="font-medium text-slate-900">{formatPercentage(row.porcentaje)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
