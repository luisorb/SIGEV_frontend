import { useRef } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { MetricGrid } from '../components/MetricGrid'
import { DashboardFilters } from '../components/DashboardFilters'
import { DashboardExport } from '../components/DashboardExport'
import { RecentOrders } from '../components/RecentOrders'
import { ConsolidadoDesembolso } from '../components/ConsolidadoDesembolso'
import { ConsolidadoAliado } from '../components/ConsolidadoAliado'
import { CoberturaTerritorial } from '../components/CoberturaTerritorial'
import { EjecucionFinanciera } from '../components/EjecucionFinanciera'
import { EventosIncompletos } from '../components/EventosIncompletos'
import { EventosPorEstado } from '../components/EventosPorEstado'
import { EvolucionTemporal } from '../components/EvolucionTemporal'
import { useQuery } from '@tanstack/react-query'
import { getEventsApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useMunicipalities } from '../../../hooks/useMunicipalities'
import { usePaymentsSummary, usePayments } from '../../../hooks/usePayments'
import type { DashboardSectionRefs } from '../types'

export function DashboardPage() {
  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: getEventsApi })
  const { data: aliados = [] } = useAllies({ all: true })
  const { data: desembolsos = [] } = useDisbursements({ all: true })
  const { data: municipios = [] } = useMunicipalities()
  const { data: paymentSummary = [] } = usePaymentsSummary()
  const { data: pagos = [] } = usePayments()

  const refEventosIncompletos = useRef<HTMLDivElement>(null)
  const refEventosPorEstado = useRef<HTMLDivElement>(null)
  const refConsolidadoDesembolso = useRef<HTMLDivElement>(null)
  const refConsolidadoAliado = useRef<HTMLDivElement>(null)
  const refEvolucionTemporal = useRef<HTMLDivElement>(null)
  const refRecentOrders = useRef<HTMLDivElement>(null)
  const refCoberturaTerritorial = useRef<HTMLDivElement>(null)

  const sectionRefs: DashboardSectionRefs = {
    eventosIncompletos: refEventosIncompletos,
    eventosPorEstado: refEventosPorEstado,
    consolidadoDesembolso: refConsolidadoDesembolso,
    consolidadoAliado: refConsolidadoAliado,
    evolucionTemporal: refEvolucionTemporal,
    recentOrders: refRecentOrders,
    coberturaTerritorial: refCoberturaTerritorial,
  }

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
    seguimientoPorEstado,
    tendenciaMensual,
    filteredEvents,
    totalRegistrados,
    totalEnEjecucion,
  } = useDashboard(events, aliados, desembolsos, municipios, pagos)

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
            {totalRegistrados} eventos registrados · {totalEnEjecucion} aprobados / en ejecución
          </p>
        </div>
        <DashboardExport
          events={filteredEvents}
          aliados={aliados}
          desembolsos={desembolsos}
          municipios={municipios}
          pagos={pagos}
          metrics={metrics}
          consolidadoDesembolso={consolidadoDesembolso}
          consolidadoAliado={consolidadoAliado}
          coberturaTerritorial={coberturaTerritorial}
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          sectionRefs={sectionRefs}
          eventosIncompletos={eventosIncompletos}
          totalRegistrados={totalRegistrados}
          totalEnEjecucion={totalEnEjecucion}
          seguimientoPorEstado={seguimientoPorEstado}
          tendenciaMensual={tendenciaMensual}
        />
      </div>

      <DashboardFilters
        filters={filters}
        aliados={aliados}
        desembolsos={desembolsos}
        municipios={municipios}
        hasActiveFilters={hasActiveFilters}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />

      <div ref={refEventosIncompletos}>
        <EventosIncompletos events={eventosIncompletos} />
      </div>

      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div ref={refEventosPorEstado}>
            <EventosPorEstado rows={seguimientoPorEstado} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div ref={refConsolidadoDesembolso}>
              <ConsolidadoDesembolso rows={consolidadoDesembolso} />
            </div>
            <div ref={refConsolidadoAliado}>
              <ConsolidadoAliado rows={consolidadoAliado} />
            </div>
          </div>
          <div ref={refEvolucionTemporal}>
            <EvolucionTemporal rows={tendenciaMensual} />
          </div>
        </div>
        <div className="space-y-6">
          <div ref={refRecentOrders}>
            <RecentOrders
              events={events}
              aliados={aliados}
              desembolsos={desembolsos}
            />
          </div>
          <div ref={refCoberturaTerritorial}>
            <CoberturaTerritorial rows={coberturaTerritorial} />
          </div>
          <EjecucionFinanciera paymentSummary={paymentSummary} />
        </div>
      </div>
    </div>
  )
}
