import type { MatrixView, DetailedRow, MatrixRow, MatrixTotals } from '../types'
import { formatCurrencyCO } from '../../../utils/formatters'

interface MatrixTableProps {
  view: MatrixView
  detailedRows: DetailedRow[]
  globalRows: MatrixRow[]
  totals: MatrixTotals
  aliadoIds: string[]
  aliadosMap: Record<string, string>
}

export function MatrixTable({ view, detailedRows, globalRows, totals, aliadoIds, aliadosMap }: MatrixTableProps) {
  if (view === 'detallada') {
    return <DetailedTable rows={detailedRows} />
  }
  return <GlobalTable rows={globalRows} totals={totals} aliadoIds={aliadoIds} aliadosMap={aliadosMap} />
}

function DetailedTable({ rows }: { rows: DetailedRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="p-3 rounded-full bg-slate-100 mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-sm font-medium text-slate-500">No hay datos de ejecución para mostrar</p>
        <p className="text-xs text-slate-400 mt-1">Crea eventos con ítems para ver la matriz detallada.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="sticky top-0 z-10 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">Evento</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[90px] bg-slate-50">Fecha</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">Territorio</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[80px] bg-slate-50">Estado</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] bg-slate-50">Descripción</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[70px] bg-slate-50">Cant</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">Vr Unit</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[70px] bg-slate-50">Carga Trib</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[110px] bg-slate-50">Base</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">IVA</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">Consumo</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">Fee Tarif</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">Fee 3ros</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50">IVA Fee</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[110px] border-l-2 border-slate-300 bg-slate-100">Total</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px] bg-slate-50">Aliado</th>
              <th className="sticky top-0 z-10 px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px] bg-slate-50">Desembolso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={row.itemId} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/50`}>
                <td className="px-3 py-2.5 text-xs font-medium text-slate-900">{row.numeroEvento}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{row.fechaEvento}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{row.municipio}</td>
                <td className="px-3 py-2.5 text-xs">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    row.estado === 'Legalizado' ? 'bg-green-100 text-green-700' :
                    row.estado === 'Cerrado' ? 'bg-blue-100 text-blue-700' :
                    row.estado === 'Ejecutado' ? 'bg-indigo-100 text-indigo-700' :
                    row.estado === 'En ejecucion' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{row.estado}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-700 max-w-[200px] truncate" title={row.descripcion}>{row.descripcion}</td>
                <td className="px-3 py-2.5 text-xs text-right text-slate-700 tabular-nums">{row.cantidad}</td>
                <td className="px-3 py-2.5 text-xs text-right text-slate-700 tabular-nums">{formatCurrencyCO(row.valorUnitario)}</td>
                <td className="px-3 py-2.5 text-xs text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    row.categoriaTributaria === 'IVA' ? 'bg-purple-100 text-purple-700' :
                    row.categoriaTributaria === 'Consumo' ? 'bg-orange-100 text-orange-700' :
                    row.categoriaTributaria === 'Tercero' ? 'bg-cyan-100 text-cyan-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{row.categoriaTributaria}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-right tabular-nums text-slate-700">{formatCurrencyCO(row.base)}</td>
                <td className="px-3 py-2.5 text-xs text-right tabular-nums text-slate-700">{formatCurrencyCO(row.iva)}</td>
                <td className="px-3 py-2.5 text-xs text-right tabular-nums text-slate-700">{formatCurrencyCO(row.impuestoConsumo)}</td>
                <td className="px-3 py-2.5 text-xs text-right tabular-nums text-slate-700">{formatCurrencyCO(row.feeTarifado)}</td>
                <td className="px-3 py-2.5 text-xs text-right tabular-nums text-slate-700">{formatCurrencyCO(row.feeTerceros)}</td>
                <td className="px-3 py-2.5 text-xs text-right tabular-nums text-slate-700">{formatCurrencyCO(row.ivaFee)}</td>
                <td className="px-3 py-2.5 text-xs text-right font-semibold tabular-nums text-slate-900 border-l-2 border-slate-300 bg-slate-50/80">{formatCurrencyCO(row.total)}</td>
                <td className="px-3 py-2.5 text-xs text-slate-700">{row.aliadoNombre}</td>
                <td className="px-3 py-2.5 text-xs text-slate-700">{row.desembolsoNombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        {rows.length} ítem{rows.length !== 1 ? 's' : ''} en total
      </div>
    </div>
  )
}

function GlobalTable({ rows, totals, aliadoIds, aliadosMap }: {
  rows: MatrixRow[]
  totals: MatrixTotals
  aliadoIds: string[]
  aliadosMap: Record<string, string>
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="p-3 rounded-full bg-slate-100 mb-3">
          <span className="text-2xl">📊</span>
        </div>
        <p className="text-sm font-medium text-slate-500">No hay datos de ejecución para mostrar</p>
        <p className="text-xs text-slate-400 mt-1">Crea eventos primero para ver la matriz global.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] bg-slate-50">
                Desembolso
              </th>
              {aliadoIds.map((aId, idx) => (
                <th key={aId} className={`sticky top-0 z-10 px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[150px] bg-slate-50 ${idx > 0 ? 'border-l border-slate-200' : 'border-l border-slate-100'}`}>
                  {aliadosMap[aId] || aId}
                </th>
              ))}
              <th className="sticky top-0 z-10 px-4 py-3.5 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[150px] border-l-2 border-slate-300 bg-slate-100">
                Totales
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIdx) => (
              <tr key={row.desembolsoId} className={`transition-colors ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/50`}>
                <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                  {row.desembolsoNombre}
                </td>
                {aliadoIds.map((aId, colIdx) => {
                  const cell = row.cells[aId]
                  return (
                    <td key={aId} className={`px-4 py-3.5 ${colIdx > 0 ? 'border-l border-slate-100' : 'border-l border-slate-50'} ${cell ? 'group relative cursor-default' : ''}`}>
                      {cell ? (
                        <div className="text-center space-y-0.5">
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-primary transition-colors tabular-nums">
                            {formatCurrencyCO(cell.valorTotal)}
                          </p>
                          <p className="text-[10px] text-slate-400 group-hover:text-slate-500 transition-colors">
                            {cell.cantidadEventos} evento{cell.cantidadEventos !== 1 ? 's' : ''}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Fee {formatCurrencyCO(cell.feeTotal)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-center text-xs text-slate-300">—</p>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3.5 border-l-2 border-slate-300 bg-slate-50/80">
                  <div className="text-center space-y-0.5">
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      {formatCurrencyCO(row.totalValor)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {row.totalEventos} evento{row.totalEventos !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Fee {formatCurrencyCO(row.totalFee)}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 border-t-2 border-slate-300">
              <td className="px-4 py-3.5 text-sm font-bold text-slate-900">
                Totales Generales
              </td>
              {aliadoIds.map((aId, colIdx) => {
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
                  <td key={aId} className={`px-4 py-3.5 text-center ${colIdx > 0 ? 'border-l border-slate-200' : 'border-l border-slate-100'}`}>
                    {totalEventos > 0 ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 tabular-nums">
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
              <td className="px-4 py-3.5 text-center border-l-2 border-slate-300 bg-slate-200/80">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrencyCO(totals.totalValor)}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {totals.totalEventos} eventos
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Fee {formatCurrencyCO(totals.totalFee)}
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
