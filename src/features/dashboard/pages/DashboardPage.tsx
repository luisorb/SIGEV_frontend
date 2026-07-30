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
import { mockEvents, getMockAliados, getMockDesembolsos, mockMunicipios } from '../../events/utils/mockData'

export function DashboardPage() {
  const aliados = useMemo(() => getMockAliados(), [])
  const desembolsos = useMemo(() => getMockDesembolsos(), [])

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
  } = useDashboard(mockEvents, aliados, desembolsos, mockMunicipios)

  const filteredEvents = useMemo(() => {
    const { periodoInicio, periodoFin, desembolsoId, aliadoId, estado, municipioId, dependencia } = filters
    let result = [...mockEvents]
    if (desembolsoId) result = result.filter((e) => e.desembolsoId === desembolsoId)
    if (aliadoId) result = result.filter((e) => e.aliadoId === aliadoId)
    if (estado) result = result.filter((e) => e.estado === estado)
    if (periodoInicio) result = result.filter((e) => e.createdAt >= periodoInicio)
    if (periodoFin) result = result.filter((e) => e.createdAt <= periodoFin)
    if (municipioId) result = result.filter((e) => e.municipioId === municipioId)
    if (dependencia) result = result.filter((e) => e.dependencia === dependencia)
    return result
  }, [filters])

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
          events={filteredEvents}
          aliados={aliados}
          desembolsos={desembolsos}
          municipios={mockMunicipios}
          metrics={metrics}
        />
      </div>

      <DashboardFilters
        filters={filters}
        aliados={aliados}
        desembolsos={desembolsos}
        municipios={mockMunicipios}
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
            events={mockEvents}
            aliados={aliados}
            desembolsos={desembolsos}
          />
        </div>
      </div>
    </div>
  )
}
