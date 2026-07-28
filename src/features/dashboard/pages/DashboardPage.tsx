import { useMemo } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { MetricGrid } from '../components/MetricGrid'
import { DashboardFilters } from '../components/DashboardFilters'
import { DashboardExport } from '../components/DashboardExport'
import { RecentOrders } from '../components/RecentOrders'
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-sm text-slate-500">
            {totalEvents} eventos registrados · Indicadores globales de ejecución
          </p>
        </div>
        <DashboardExport
          events={mockEvents}
          aliados={mockAliados}
          desembolsos={mockDesembolsos}
        />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConsolidadoDesembolso rows={consolidadoDesembolso} />
            <ConsolidadoAliado rows={consolidadoAliado} />
          </div>
        </div>
        <div>
          <RecentOrders
            events={mockEvents}
            aliados={mockAliados}
            desembolsos={mockDesembolsos}
          />
        </div>
      </div>
    </div>
  )
}
