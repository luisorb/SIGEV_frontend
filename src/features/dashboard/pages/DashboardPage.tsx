import { useDashboard } from '../hooks/useDashboard'
import { MetricGrid } from '../components/MetricGrid'
import { DashboardFilters } from '../components/DashboardFilters'
import { DashboardExport } from '../components/DashboardExport'
import { RecentOrders } from '../components/RecentOrders'
import { ConsolidadoDesembolso } from '../components/ConsolidadoDesembolso'
import { ConsolidadoAliado } from '../components/ConsolidadoAliado'
import { CoberturaTerritorial } from '../components/CoberturaTerritorial'
import { EventosIncompletos } from '../components/EventosIncompletos'
import { NumeroEventosCard } from '../components/NumeroEventosCard'
import { useQuery } from '@tanstack/react-query'
import { getEventsApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useMunicipalities } from '../../../hooks/useMunicipalities'

export function DashboardPage() {
  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: getEventsApi })
  const { data: aliados = [] } = useAllies()
  const { data: desembolsos = [] } = useDisbursements()
  const { data: municipios = [] } = useMunicipalities()

  const {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    metrics,
    consolidadoDesembolso,
    consolidadoAliado,
    coberturaTerritorial,
    eventosIncompletos,
    dependencias,
    filteredEvents,
    totalRegistrados,
    totalEnEjecucion,
  } = useDashboard(events, aliados, desembolsos, municipios)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando panel...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-sm text-slate-500">
            {totalRegistrados} eventos registrados · {totalEnEjecucion} aprobados/en ejecución
          </p>
        </div>
        <DashboardExport
          events={filteredEvents}
          aliados={aliados}
          desembolsos={desembolsos}
          municipios={municipios}
          metrics={metrics}
        />
      </div>

      <DashboardFilters
        filters={filters}
        aliados={aliados}
        desembolsos={desembolsos}
        municipios={municipios}
        dependencias={dependencias}
        hasActiveFilters={hasActiveFilters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />

      <EventosIncompletos events={eventosIncompletos} />

      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConsolidadoDesembolso rows={consolidadoDesembolso} />
            <ConsolidadoAliado rows={consolidadoAliado} />
          </div>
          <CoberturaTerritorial rows={coberturaTerritorial} />
        </div>
        <div className="space-y-6">
          <NumeroEventosCard
            count={metrics.numeroEventos}
            totalRegistrados={totalRegistrados}
          />
          <RecentOrders
            events={events}
            aliados={aliados}
            desembolsos={desembolsos}
          />
        </div>
      </div>
    </div>
  )
}
