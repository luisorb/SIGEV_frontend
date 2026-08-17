import { Layers } from 'lucide-react'
import type { ComposicionTotal } from '../types'
import { formatCurrencyCO, formatPercentage } from '../../../utils/formatters'

const SEGMENTS = [
  { key: 'base', label: 'Base', source: 'Cantidad × Valor unitario', gradient: 'linear-gradient(135deg, #f43340, #e85d6a)' },
  { key: 'impuestos', label: 'Impuestos', source: 'IVA + INC', gradient: 'linear-gradient(135deg, #f97316, #fb923c)' },
  { key: 'fee', label: 'FEE Técnico Adm.', source: 'Tarifado + Terceros', gradient: 'linear-gradient(135deg, #eab308, #facc15)' },
  { key: 'ivaFee', label: 'IVA del FEE', source: 'IVA sobre el FEE', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
] as const

interface ComposicionTotalProps {
  data: ComposicionTotal
}

export function ComposicionTotal({ data }: ComposicionTotalProps) {
  const { total } = data
  const values = SEGMENTS.map((s) => data[s.key as keyof typeof data])

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200">
        <Layers className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Composici&oacute;n del total ejecutado</h3>
        <span className="text-xs font-semibold text-slate-900 tabular-nums ml-auto">
          {formatCurrencyCO(total)}
        </span>
      </div>
      {total === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          No hay datos para los filtros seleccionados.
        </div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="flex h-8 w-full rounded-lg overflow-hidden">
            {SEGMENTS.map((seg, i) => {
              const pct = total > 0 ? (values[i] / total) * 100 : 0
              const useDarkText = i >= 2
              return (
                <div
                  key={seg.key}
                  className="relative group h-full flex items-center justify-center transition-all"
                  style={{
                    width: `${pct}%`,
                    background: seg.gradient,
                  }}
                >
                  {pct > 12 && (
                    <span className={`text-[10px] font-semibold tabular-nums drop-shadow-sm ${useDarkText ? 'text-slate-800' : 'text-white'}`}>
                      {formatPercentage(total > 0 ? values[i] / total : 0)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {SEGMENTS.map((seg, i) => {
              const value = values[i]
              return (
                <div key={seg.key} className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: seg.gradient }}
                    />
                    <span className="text-slate-600 leading-tight">
                      {seg.label} <span className="text-slate-400">({seg.source})</span>
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900 tabular-nums leading-tight">
                      {formatCurrencyCO(value)}
                    </p>
                    <p className="text-[10px] text-slate-400 tabular-nums">
                      {formatPercentage(total > 0 ? value / total : 0)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
