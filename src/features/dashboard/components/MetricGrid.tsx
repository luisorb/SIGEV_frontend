import { useState } from 'react'
import { Wallet, Receipt, Info, ChevronDown } from 'lucide-react'
import type { DashboardMetrics } from '../types'
import { MetricCard } from './MetricCard'

interface MetricGridProps {
  metrics: DashboardMetrics
}

export function MetricGrid({ metrics }: MetricGridProps) {
  const [legendExpanded, setLegendExpanded] = useState(false)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          icon={Wallet}
          label="Valor Total Ejecutado (pagos)"
          value={metrics.valorTotalEjecutado}
          accent="red"
        />
        <MetricCard
          icon={Receipt}
          label="N&uacute;mero de pagos"
          value={metrics.numeroPagos}
          format="number"
          accent="amber"
        />
      </div>

      <div className="flex items-start gap-2 px-1">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[11px] leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-600">Valor Total Ejecutado:</span> suma de los pagos
            registrados con estado distinto a Anulado, asociados a los eventos aprobados / en ejecuci&oacute;n
            que cumplen los filtros.
          </p>
          {legendExpanded && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-600">N&uacute;mero de pagos:</span> cantidad de pagos
              v&aacute;lidos (excluye anulados) dentro del filtro actual.
            </p>
          )}
          <button
            type="button"
            onClick={() => setLegendExpanded((v) => !v)}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-dark transition-colors"
          >
            {legendExpanded ? 'Leer menos' : 'Leer m\u00e1s'}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${legendExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
