import { useMemo } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { MetricGrid } from '../components/MetricGrid'
import { DashboardFilters } from '../components/DashboardFilters'
import { ConsolidadoDesembolso } from '../components/ConsolidadoDesembolso'
import { ConsolidadoAliado } from '../components/ConsolidadoAliado'
import { mockEvents, mockAliados, mockDesembolsos } from '../../events/utils/mockData'

export function DashboardPage() {
  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    metrics,
    consolidadoDesembolso,
    consolidadoAliado,
  } = useDashboard(mockEvents, mockAliados, mockDesembolsos)

  const totalEvents = useMemo(() => mockEvents.length, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-sm text-slate-500">
          {totalEvents} eventos registrados · Indicadores globales de ejecución
        </p>
      </div>

      <DashboardFilters
        filters={filters}
        aliados={mockAliados}
        desembolsos={mockDesembolsos}
        hasActiveFilters={hasActiveFilters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />

      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsolidadoDesembolso rows={consolidadoDesembolso} />
        <ConsolidadoAliado rows={consolidadoAliado} />
      </div>
    </div>
  )
}
