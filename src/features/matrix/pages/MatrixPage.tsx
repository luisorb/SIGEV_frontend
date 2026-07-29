import { useMatrix } from '../hooks/useMatrix'
import { MatrixTable } from '../components/MatrixTable'
import { MatrixExcelExport } from '../components/MatrixExcelExport'
import { mockEvents, getMockAliados, getMockDesembolsos } from '../../events/utils/mockData'
import { formatCurrencyCO } from '../../../utils/formatters'

export function MatrixPage() {
  const {
    rows,
    totals,
    aliadoIds,
    aliadosMap,
    desembolsosMap,
    selectedDesembolso,
    selectedAliado,
    setSelectedDesembolso,
    setSelectedAliado,
  } = useMatrix(mockEvents, getMockAliados(), getMockDesembolsos())

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matriz de Ejecución</h1>
          <p className="text-sm text-slate-500 mt-1">
            Distribución cruzada por desembolso y aliado · {totals.totalEventos} eventos · Total {formatCurrencyCO(totals.totalValor)}
          </p>
        </div>
        <MatrixExcelExport
          rows={rows}
          totals={totals}
          aliadoIds={aliadoIds}
          aliadosMap={aliadosMap}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={selectedDesembolso}
          onChange={(e) => setSelectedDesembolso(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos los desembolsos</option>
          {Object.entries(desembolsosMap).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
        <select
          value={selectedAliado}
          onChange={(e) => setSelectedAliado(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos los aliados</option>
          {Object.entries(aliadosMap).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
      </div>

      <MatrixTable
        rows={rows}
        totals={totals}
        aliadoIds={aliadoIds}
        aliadosMap={aliadosMap}
      />
    </div>
  )
}
