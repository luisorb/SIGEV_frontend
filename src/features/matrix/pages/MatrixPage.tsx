import { useMatrix } from '../hooks/useMatrix'
import { MatrixTable } from '../components/MatrixTable'
import { MatrixExcelExport } from '../components/MatrixExcelExport'
import { mockEvents, getMockAliados, getMockDesembolsos } from '../../events/utils/mockData'
import { mockMunicipios } from '../../events/utils/mockData'
import { EVENT_STATES } from '../../../config/constants'
import { formatCurrencyCO } from '../../../utils/formatters'
import { Table2, Calendar, DollarSign, FileSpreadsheet, Filter, List, Grid3x3, Layers, Receipt, BadgePercent, FileText } from 'lucide-react'

export function MatrixPage() {
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
  } = useMatrix(mockEvents, getMockAliados(), getMockDesembolsos(), mockMunicipios)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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
          <MatrixExcelExport
            detailedRows={detailedRows}
            globalRows={globalRows}
            totals={totals}
            aliadoIds={aliadoIds}
            aliadosMap={aliadosMap}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 shrink-0">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Eventos</p>
            <p className="text-lg font-bold text-slate-900">{summary.totalEventos}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 shrink-0">
            <List className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Ítems</p>
            <p className="text-lg font-bold text-slate-900">{summary.totalItems}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 shrink-0">
            <DollarSign className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Base Total</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrencyCO(summary.totalBase)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Total General</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrencyCO(summary.totalGeneral)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-50 shrink-0">
            <Receipt className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">IVA</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalIva)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-orange-50 shrink-0">
            <Receipt className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Consumo</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalConsumo)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-teal-50 shrink-0">
            <BadgePercent className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Fee Total</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalFee)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-50 shrink-0">
            <FileText className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">IVA Fee</p>
            <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrencyCO(totals.totalIvaFee)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView('detallada')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'detallada'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Detallada
          </button>
          <button
            onClick={() => setView('global')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === 'global'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            Global
          </button>
        </div>

        <div className="w-px h-6 bg-slate-200" />

        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
          hasFilters
            ? 'bg-red-50 border-red-300 text-red-700'
            : 'border-slate-300 text-slate-500'
        }`}>
          <Filter className="w-3.5 h-3.5" />
          <span className="font-medium">Filtros</span>
        </div>

        <input
          type="date"
          value={filters.periodoDesde}
          onChange={(e) => updateFilter('periodoDesde', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          title="Fecha desde"
        />
        <input
          type="date"
          value={filters.periodoHasta}
          onChange={(e) => updateFilter('periodoHasta', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          title="Fecha hasta"
        />
        <select
          value={filters.municipioId}
          onChange={(e) => updateFilter('municipioId', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">Todos los territorios</option>
          {Object.entries(municipiosMap).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
        <select
          value={filters.estado}
          onChange={(e) => updateFilter('estado', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">Todos los estados</option>
          {EVENT_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filters.desembolsoId}
          onChange={(e) => updateFilter('desembolsoId', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">Todos los desembolsos</option>
          {Object.entries(desembolsosMap).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
        <select
          value={filters.aliadoId}
          onChange={(e) => updateFilter('aliadoId', e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
        >
          <option value="">Todos los aliados</option>
          {Object.entries(aliadosMap).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {view === 'detallada' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span>
            Vista detallada: desglose ítem por ítem. Si un ítem tiene un aliado asignado,
            este prevalece sobre el aliado general del evento para efectos de consolidación.
          </span>
        </div>
      )}

      <MatrixTable
        view={view}
        detailedRows={detailedRows}
        globalRows={globalRows}
        totals={totals}
        aliadoIds={aliadoIds}
        aliadosMap={aliadosMap}
      />
    </div>
  )
}
