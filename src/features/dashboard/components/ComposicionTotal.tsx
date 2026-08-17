import { Layers } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { ComposicionTotal } from '../types'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'

const SEGMENTS = [
  { key: 'base', label: 'Base', source: 'Cantidad × Valor unitario', color: '#3B82F6' },
  { key: 'impuestos', label: 'Impuestos', source: 'IVA + INC', color: '#F59E0B' },
  { key: 'fee', label: 'FEE Técnico Adm.', source: 'Tarifado + Terceros', color: '#f43340' },
  { key: 'ivaFee', label: 'IVA del FEE', source: 'IVA sobre el FEE', color: '#14B8A6' },
] as const

interface ComposicionTotalProps {
  data: ComposicionTotal
}

interface TooltipPayloadItem {
  name?: string
  value?: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-xs space-y-1">
      <p className="font-semibold text-slate-900 mb-1">Composición del total</p>
      {payload.map((item) => {
        const seg = SEGMENTS.find((s) => s.key === item.name)
        if (!seg || !item.value) return null
        return (
          <div key={seg.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              {seg.label}
            </span>
            <span className="font-medium text-slate-900 tabular-nums">{formatCurrencyCO(item.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ComposicionTotal({ data }: ComposicionTotalProps) {
  const { base, impuestos, fee, ivaFee, total } = data
  const row = { base, impuestos, fee, ivaFee }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Layers className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Composición del total ejecutado</h3>
        <span className="text-xs font-semibold text-slate-900 tabular-nums ml-auto">
          {formatCurrencyCO(total)}
        </span>
      </div>
      {total === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5">
          <ResponsiveContainer width="100%" height={56}>
            <BarChart layout="vertical" data={[row]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, total]} />
              <YAxis type="category" hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              {SEGMENTS.map((seg) => (
                <Bar key={seg.key} dataKey={seg.key} stackId="composicion" fill={seg.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-4">
            {SEGMENTS.map((seg) => (
              <div key={seg.key} className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-slate-600 leading-tight">
                    {seg.label} <span className="text-slate-400">({seg.source})</span>
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-slate-900 tabular-nums leading-tight">
                    {formatCurrencyCO(row[seg.key])}
                  </p>
                  <p className="text-[10px] text-slate-400 tabular-nums">
                    {formatPercentage(total > 0 ? row[seg.key] / total : 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
