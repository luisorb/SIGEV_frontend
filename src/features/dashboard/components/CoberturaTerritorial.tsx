import { MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'
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
      <p className="text-slate-600">Valor: {formatCurrencyCO(d.valorTotal)}</p>
      <p className="text-slate-600">Eventos: {d.cantidadEventos}</p>
      <p className="text-slate-600">Participacion: {formatPercentage(d.porcentaje)}</p>
    </div>
  )
}

function CustomBarShape(props: Record<string, unknown>) {
  const { x, y, width, height, index } = props as {
    x: number; y: number; width: number; height: number; index: number
  }
  const radius = 4
  const color = COLORS[(index as number) % COLORS.length]

  if (!width || !height) return null

  return (
    <g>
      <defs>
        <linearGradient id={`barGrad-${index}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity={0.7} />
          <stop offset="100%" stopColor={color} stopOpacity={1} />
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#barGrad-${index})`}
        rx={0}
        ry={0}
      />
      <rect
        x={x + width - radius}
        y={y}
        width={radius}
        height={height}
        fill={`url(#barGrad-${index})`}
      />
      <path
        d={`M ${x + width - radius} ${y} Q ${x + width} ${y} ${x + width} ${y + radius}`}
        fill={color}
      />
      <path
        d={`M ${x + width - radius} ${y + height} Q ${x + width} ${y + height} ${x + width} ${y + height - radius}`}
        fill={color}
      />
    </g>
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

  const maxValue = Math.max(...data.map((d) => d.valorTotal), 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <MapPin className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Cobertura Territorial</h3>
        <span className="text-xs text-slate-500 ml-auto">{rows.length} municipio(s)</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={Math.max(rows.length * 44, 120)}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 2, right: 60, left: 0, bottom: 2 }}
              barCategoryGap="20%"
            >
              <XAxis
                type="number"
                hide
                domain={[0, maxValue * 1.15]}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
              />
              <Bar
                dataKey="valorTotal"
                shape={<CustomBarShape />}
                barSize={24}
                radius={[0, 4, 4, 0]}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} />
                ))}
                <LabelList
                  dataKey="porcentaje"
                  position="right"
                  formatter={(v: number) => formatPercentage(v)}
                  style={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                  offset={8}
                />
              </Bar>
            </BarChart>
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
