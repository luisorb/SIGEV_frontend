import { useRef, useState, useEffect, useCallback } from 'react'
import { useMatrix } from '../hooks/useMatrix'
import { MatrixTable } from '../components/MatrixTable'
import { MatrixExcelExport } from '../components/MatrixExcelExport'
import { getEventsApi } from '../../../services/events.service'
import { getAliadosSync, getDesembolsosSync } from '../../../lib/catalogStore'
import { mockMunicipios } from '../../events/utils/mockData'
import { EVENT_STATES } from '../../../config/constants'
import { formatCurrencyCO } from '../../../utils/formatters'
import { Table2, Calendar, DollarSign, FileSpreadsheet, Filter, List, Grid3x3, Receipt, BadgePercent, FileText, Maximize2, Minimize2 } from 'lucide-react'
import type { Event } from '../../../types'

export function MatrixPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEventsApi().then((data) => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  const aliados = getAliadosSync()
  const desembolsos = getDesembolsosSync()

  const {
    view,
    setView,
    filters,
    updateFilter,
    clearFilters,
    hasFilters,
    detailedRows,
    globalRows,
    totals,
    summary,
    aliadoIds,
    aliadosMap,
    desembolsosMap,
    municipiosMap,
  } = useMatrix(events, aliados, desembolsos, mockMunicipios)

  const [showFilters, setShowFilters] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      tableRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando matriz...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Table2 className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-slate-900">Matriz de Ejecución</h1>
          </div>
          <p className="text-sm text-slate-500">
            Reporte financiero desagregado y consolidado del avance económico de los eventos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver tabla a pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
          </button>
          <MatrixExcelExport
            detailedRows={detailedRows}
            globalRows={globalRows}
            totals={totals}
            aliadoIds={aliadoIds}
            aliadosMap={aliadosMap}
          />
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-8 gap-2">
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 shrink-0"><Calendar className="w-3.5 h-3.5 text-blue-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Eventos</p><p className="text-[13px] font-bold text-slate-900">{summary.totalEventos}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 shrink-0"><List className="w-3.5 h-3.5 text-indigo-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Ítems</p><p className="text-[13px] font-bold text-slate-900">{summary.totalItems}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-green-50 shrink-0"><DollarSign className="w-3.5 h-3.5 text-green-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Base Total</p><p className="text-[13px] font-bold text-slate-900 tabular-nums">{formatCurrencyCO(summary.totalBase)}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50 shrink-0"><FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Total General</p><p className="text-[13px] font-bold text-slate-900 tabular-nums">{formatCurrencyCO(summary.totalGeneral)}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-50 shrink-0"><Receipt className="w-3.5 h-3.5 text-purple-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">IVA</p><p className="text-[13px] font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalIva)}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-orange-50 shrink-0"><Receipt className="w-3.5 h-3.5 text-orange-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Consumo</p><p className="text-[13px] font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalConsumo)}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-teal-50 shrink-0"><BadgePercent className="w-3.5 h-3.5 text-teal-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">Fee Total</p><p className="text-[13px] font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalFee)}</p></div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-2.5 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-rose-50 shrink-0"><FileText className="w-3.5 h-3.5 text-rose-600" /></div>
          <div className="min-w-0"><p className="text-[9px] font-medium text-slate-500 uppercase tracking-wide">IVA Fee</p><p className="text-[13px] font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalIvaFee)}</p></div>
        </div>
      </div>

      <div className="shrink-0 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button onClick={() => setView('detallada')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'detallada' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-3.5 h-3.5" /> Detallada</button>
          <button onClick={() => setView('global')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === 'global' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Grid3x3 className="w-3.5 h-3.5" /> Global</button>
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${hasFilters ? 'bg-red-50 border-red-300 text-red-700' : showFilters ? 'bg-slate-200 border-slate-300 text-slate-700' : 'border-slate-300 text-slate-500 hover:bg-slate-100'}`}><Filter className="w-3.5 h-3.5" /> Filtros</button>
        {showFilters && (
          <>
            <input type="date" value={filters.periodoDesde} onChange={(e) => updateFilter('periodoDesde', e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white" title="Fecha desde" />
            <input type="date" value={filters.periodoHasta} onChange={(e) => updateFilter('periodoHasta', e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white" title="Fecha hasta" />
            <select value={filters.municipioId} onChange={(e) => updateFilter('municipioId', e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"><option value="">Todos los territorios</option>{Object.entries(municipiosMap).map(([id, nombre]) => (<option key={id} value={id}>{nombre}</option>))}</select>
            <select value={filters.estado} onChange={(e) => updateFilter('estado', e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"><option value="">Todos los estados</option>{EVENT_STATES.map((s) => (<option key={s} value={s}>{s}</option>))}</select>
            <select value={filters.desembolsoId} onChange={(e) => updateFilter('desembolsoId', e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"><option value="">Todos los desembolsos</option>{Object.entries(desembolsosMap).map(([id, nombre]) => (<option key={id} value={id}>{nombre}</option>))}</select>
            <select value={filters.aliadoId} onChange={(e) => updateFilter('aliadoId', e.target.value)} className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"><option value="">Todos los aliados</option>{Object.entries(aliadosMap).map(([id, nombre]) => (<option key={id} value={id}>{nombre}</option>))}</select>
            {hasFilters && <button onClick={clearFilters} className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition-colors">Limpiar</button>}
          </>
        )}
      </div>

      <div className="flex-1 min-h-0" ref={tableRef}>
        <MatrixTable view={view} detailedRows={detailedRows} globalRows={globalRows} totals={totals} aliadoIds={aliadoIds} aliadosMap={aliadosMap} isFullscreen={isFullscreen} onExitFullscreen={toggleFullscreen} />
      </div>
    </div>
  )
}
