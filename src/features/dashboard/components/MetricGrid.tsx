import { DollarSign, ClipboardList, Calculator, Percent, Receipt } from 'lucide-react'
import type { DashboardMetrics } from '../types'
import { MetricCard } from './MetricCard'

interface MetricGridProps {
  metrics: DashboardMetrics
}

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      <MetricCard
        icon={DollarSign}
        label="Valor Total Ejecución"
        value={metrics.valorTotalEjecucion}
        accent="blue"
      />
      <MetricCard
        icon={ClipboardList}
        label="Número de Eventos"
        value={metrics.numeroEventos}
        format="number"
        accent="emerald"
      />
      <MetricCard
        icon={Calculator}
        label="Base + Impuestos"
        value={metrics.baseMasImpuestos}
        accent="amber"
      />
      <MetricCard
        icon={Percent}
        label="Fee Técnico Administrativo"
        value={metrics.feeAcumulado}
        accent="purple"
      />
      <MetricCard
        icon={Receipt}
        label="Impuestos Acumulados"
        value={metrics.impuestosAcumulados}
        accent="rose"
      />
    </div>
  )
}
