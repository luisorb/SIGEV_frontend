import { MapPin } from 'lucide-react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import type { CoberturaItem } from '../types'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'

const COLORS = ['#f43340', '#EAB308', '#22C55E', '#6366F1', '#F97316', '#EC4899', '#14B8A6', '#A855F7']

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
      <p className="text-slate-600">Part.: {formatPercentage(d.porcentaje)}</p>
    </div>
  )
}

interface TreemapContentProps {
  x: number
  y: number
  width: number
  height: number
  index: number
  municipio: string
  cantidadEventos: number
  valorTotal: number
}

function TreemapContent({ x, y, width, height, index, municipio, cantidadEventos }: TreemapContentProps) {
  if (width < 20 || height < 20) return null
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={COLORS[index % COLORS.length]}
        rx={4}
        ry={4}
        opacity={0.85}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 4}
        textAnchor="middle"
        fill="white"
        fontSize={width < 60 ? 9 : 11}
        fontWeight={600}
      >
        {municipio}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 12}
        textAnchor="middle"
        fill="rgba(255,255,255,0.85)"
        fontSize={9}
      >
        {cantidadEventos} ev.
      </text>
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
    size: r.valorTotal,
  }))

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
          <ResponsiveContainer width="100%" height={260}>
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="rgba(255,255,255,0.3)"
              content={TreemapContent as any}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
            {rows.map((row, i) => (
              <div key={row.municipioId} className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
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
