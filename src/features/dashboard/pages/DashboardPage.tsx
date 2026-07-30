import { useMemo } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { MetricGrid } from '../components/MetricGrid'
import { DashboardFilters } from '../components/DashboardFilters'
import { DashboardExport } from '../components/DashboardExport'
import { RecentOrders } from '../components/RecentOrders'
import { ConsolidadoDesembolso } from '../components/ConsolidadoDesembolso'
import { ConsolidadoAliado } from '../components/ConsolidadoAliado'
import { CoberturaTerritorial } from '../components/CoberturaTerritorial'
import { EventosIncompletos } from '../components/EventosIncompletos'
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
  } = useDashboard(events, aliados, desembolsos, municipios)

  const filteredEvents = useMemo(() => {
    const { periodoInicio, periodoFin, desembolsoId, aliadoId, estado, municipioId, dependencia } = filters
    let result = [...events]
    if (desembolsoId) result = result.filter((e) => e.desembolsoId === desembolsoId)
    if (aliadoId) result = result.filter((e) => e.aliadoId === aliadoId)
    if (estado) result = result.filter((e) => e.estado === estado)
    if (periodoInicio) result = result.filter((e) => e.createdAt >= periodoInicio)
    if (periodoFin) result = result.filter((e) => e.createdAt <= periodoFin)
    if (municipioId) result = result.filter((e) => e.municipioId === municipioId)
    if (dependencia) result = result.filter((e) => e.dependencia === dependencia)
    return result
  }, [events, filters])

  const totalEvents = events.length

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
            {totalEvents} eventos registrados · Indicadores globales de ejecución
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
