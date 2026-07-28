import type { MatrixRow, MatrixTotals } from '../types'
import { formatCurrencyCO } from '../../../utils/formatters'

interface MatrixTableProps {
  rows: MatrixRow[]
  totals: MatrixTotals
  aliadoIds: string[]
  aliadosMap: Record<string, string>
}

export function MatrixTable({ rows, totals, aliadoIds, aliadosMap }: MatrixTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        No hay datos de ejecución para mostrar. Crea eventos primero.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px]">
                Desembolso
              </th>
              {aliadoIds.map((aId) => (
                <th key={aId} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px] border-l border-slate-200">
                  {aliadosMap[aId] || aId}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[140px] border-l-2 border-slate-300 bg-slate-100">
                Totales
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.desembolsoId} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {row.desembolsoNombre}
                </td>
                {aliadoIds.map((aId) => {
                  const cell = row.cells[aId]
                  return (
                    <td key={aId} className="px-4 py-3 border-l border-slate-100">
                      {cell ? (
                        <div className="text-center space-y-0.5">
                          <p className="text-xs font-semibold text-slate-900">
                            {formatCurrencyCO(cell.valorTotal)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {cell.cantidadEventos} evento{cell.cantidadEventos !== 1 ? 's' : ''}
                          </p>
                        </div>
                      ) : (
                        <p className="text-center text-xs text-slate-300">—</p>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3 border-l-2 border-slate-300 bg-slate-50">
                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">
                      {formatCurrencyCO(row.totalValor)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {row.totalEventos} evento{row.totalEventos !== 1 ? 's' : ''} · Fee {formatCurrencyCO(row.totalFee)}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 border-t-2 border-slate-300">
            <tr>
              <td className="px-4 py-3 text-sm font-bold text-slate-900">
                Totales Generales
              </td>
              {aliadoIds.map((aId) => {
                let totalValor = 0
                let totalEventos = 0
                for (const r of rows) {
                  const cell = r.cells[aId]
                  if (cell) {
                    totalValor += cell.valorTotal
                    totalEventos += cell.cantidadEventos
                  }
                }
                return (
                  <td key={aId} className="px-4 py-3 text-center border-l border-slate-200">
                    {totalEventos > 0 ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900">
                          {formatCurrencyCO(totalValor)}
                        </p>
                        <p className="text-[10px] text-slate-500">{totalEventos} evento{totalEventos !== 1 ? 's' : ''}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300">—</p>
                    )}
                  </td>
                )
              })}
              <td className="px-4 py-3 text-center border-l-2 border-slate-300 bg-slate-200">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrencyCO(totals.totalValor)}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {totals.totalEventos} eventos · Fee {formatCurrencyCO(totals.totalFee)}
                  </p>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
