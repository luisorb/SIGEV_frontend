import { ClipboardList, TrendingUp } from 'lucide-react'
import { formatNumberCO } from '../../../utils/formatters'

interface NumeroEventosCardProps {
  count: number
  totalRegistrados: number
}

export function NumeroEventosCard({ count, totalRegistrados }: NumeroEventosCardProps) {
  const porcentaje = totalRegistrados > 0 ? (count / totalRegistrados) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2 min-w-0">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Número de Eventos
          </span>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-slate-900">{formatNumberCO(count)}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            {porcentaje.toFixed(0)}% de {formatNumberCO(totalRegistrados)} registrados
          </p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
        </div>
      </div>
    </div>
  )
}
