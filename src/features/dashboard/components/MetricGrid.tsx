import { DollarSign, Calculator, Percent, Receipt } from 'lucide-react'
import type { DashboardMetrics } from '../types'
import { MetricCard } from './MetricCard'

interface MetricGridProps {
  metrics: DashboardMetrics
}

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={DollarSign}
        label="Valor Total Ejecuci&oacute;n"
        value={metrics.valorTotalEjecucion}
        accent="red"
      />
      <MetricCard
        icon={Calculator}
        label="Base + Impuestos"
        value={metrics.baseMasImpuestos}
        accent="amber"
      />
      <MetricCard
        icon={Percent}
        label="FEE T&eacute;cnico Administrativo"
        value={metrics.feeAcumulado}
        accent="green"
      />
      <MetricCard
        icon={Receipt}
        label="Impuestos Acumulados"
        value={metrics.impuestosAcumulados}
        accent="slate"
      />
    </div>
  )
}
