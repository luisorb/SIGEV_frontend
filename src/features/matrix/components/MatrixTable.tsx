import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Minimize2 } from 'lucide-react'
import type { MatrixView, DetailedRow, MatrixRow, MatrixTotals } from '../types'
import { formatCurrencyCO } from '../../../utils/formatters'

interface MatrixTableProps {
  view: MatrixView
  detailedRows: DetailedRow[]
  globalRows: MatrixRow[]
  totals: MatrixTotals
  aliadoIds: string[]
  aliadosMap: Record<string, string>
  isFullscreen?: boolean
  onExitFullscreen?: () => void
}

export function MatrixTable({ view, detailedRows, globalRows, totals, aliadoIds, aliadosMap, isFullscreen, onExitFullscreen }: MatrixTableProps) {
  if (view === 'detallada') {
    return <DetailedTable rows={detailedRows} isFullscreen={isFullscreen} onExitFullscreen={onExitFullscreen} />
  }
  return <GlobalTable rows={globalRows} totals={totals} aliadoIds={aliadoIds} aliadosMap={aliadosMap} isFullscreen={isFullscreen} onExitFullscreen={onExitFullscreen} />
}

function SortHeader({ column, sortColumn, sortDirection, onSort, align = 'left', children }: {
  column: string
  sortColumn: string
  sortDirection: 'asc' | 'desc' | null
  onSort: (column: string) => void
  align?: 'left' | 'right' | 'center'
  children: React.ReactNode
}) {
  const isActive = sortColumn === column
  return (
    <th
      className={`sticky top-0 z-10 px-3 py-3 text-${align} text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] bg-slate-50 cursor-pointer hover:text-slate-700 select-none`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
        {children}
        {isActive && sortDirection === 'asc' ? (
          <ArrowUp className="w-3 h-3 shrink-0" />
        ) : isActive && sortDirection === 'desc' ? (
          <ArrowDown className="w-3 h-3 shrink-0" />
        ) : (
          <ArrowUpDown className="w-3 h-3 shrink-0 opacity-40" />
        )}
      </div>
    </th>
  )
}

type PageSize = 10 | 20 | 30 | 50 | 100

function DetailedTable({ rows, isFullscreen, onExitFullscreen }: { rows: DetailedRow[]; isFullscreen?: boolean; onExitFullscreen?: () => void }) {
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(20)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn('')
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return rows

    const sorted = [...rows]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case 'numeroEvento': cmp = a.numeroEvento.localeCompare(b.numeroEvento); break
        case 'fechaEvento': cmp = a.fechaEvento.localeCompare(b.fechaEvento); break
        case 'municipio': cmp = a.municipio.localeCompare(b.municipio); break
        case 'estado': cmp = a.estado.localeCompare(b.estado); break
        case 'descripcion': cmp = a.descripcion.localeCompare(b.descripcion); break
        case 'cantidad': cmp = a.cantidad - b.cantidad; break
        case 'valorUnitario': cmp = a.valorUnitario - b.valorUnitario; break
        case 'categoriaTributaria': cmp = a.categoriaTributaria.localeCompare(b.categoriaTributaria); break
        case 'base': cmp = a.base - b.base; break
        case 'iva': cmp = a.iva - b.iva; break
        case 'impuestoConsumo': cmp = a.impuestoConsumo - b.impuestoConsumo; break
        case 'feeTarifado': cmp = a.feeTarifado - b.feeTarifado; break
        case 'feeTerceros': cmp = a.feeTerceros - b.feeTerceros; break
        case 'ivaFee': cmp = a.ivaFee - b.ivaFee; break
        case 'total': cmp = a.total - b.total; break
        case 'aliadoNombre': cmp = a.aliadoNombre.localeCompare(b.aliadoNombre); break
        case 'desembolsoNombre': cmp = a.desembolsoNombre.localeCompare(b.desembolsoNombre); break
      }
      return sortDirection === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [rows, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, safePage, pageSize])

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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col relative">
      {isFullscreen && onExitFullscreen && (
        <button
          onClick={onExitFullscreen}
          className="absolute top-3 right-3 z-50 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 shadow-sm transition-colors"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          Salir
        </button>
      )}
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <SortHeader column="numeroEvento" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Evento</SortHeader>
              <SortHeader column="fechaEvento" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Fecha</SortHeader>
              <SortHeader column="municipio" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Territorio</SortHeader>
              <SortHeader column="estado" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Estado</SortHeader>
              <SortHeader column="descripcion" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Descripción</SortHeader>
              <SortHeader column="cantidad" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">Cant</SortHeader>
              <SortHeader column="valorUnitario" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">Vr Unit</SortHeader>
              <SortHeader column="categoriaTributaria" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="center">Carga Trib</SortHeader>
              <SortHeader column="base" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">Base</SortHeader>
              <SortHeader column="iva" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">IVA</SortHeader>
              <SortHeader column="impuestoConsumo" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">Consumo</SortHeader>
              <SortHeader column="feeTarifado" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">Fee Tarif</SortHeader>
              <SortHeader column="feeTerceros" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">Fee 3ros</SortHeader>
              <SortHeader column="ivaFee" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="right">IVA Fee</SortHeader>
              <th className="sticky top-0 z-10 px-3 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[110px] border-l-2 border-slate-300 bg-slate-100 cursor-pointer hover:text-slate-900 select-none" onClick={() => handleSort('total')}>
                <div className="flex items-center justify-end gap-1">
                  Total
                  {sortColumn === 'total' && sortDirection === 'asc' ? (
                    <ArrowUp className="w-3 h-3 shrink-0" />
                  ) : sortColumn === 'total' && sortDirection === 'desc' ? (
                    <ArrowDown className="w-3 h-3 shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 shrink-0 opacity-40" />
                  )}
                </div>
              </th>
              <SortHeader column="aliadoNombre" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Aliado</SortHeader>
              <SortHeader column="desembolsoNombre" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Desembolso</SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.map((row, idx) => (
              <tr key={row.itemId} className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/50`}>
                <td className="px-3 py-2.5 text-xs font-medium text-slate-900">{row.numeroEvento}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{row.fechaEvento}</td>
                <td className="px-3 py-2.5 text-xs text-slate-600">{row.municipio}</td>
                <td className="px-3 py-2.5 text-xs">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    row.estado === 'Legalizado' ? 'bg-green-100 text-green-700' :
                    row.estado === 'Cerrado' ? 'bg-blue-100 text-blue-700' :
                    row.estado === 'En ejecución' ? 'bg-indigo-100 text-indigo-700' :
                    row.estado === 'Ejecutado' ? 'bg-amber-100 text-amber-700' :
                    row.estado === 'Devuelto' ? 'bg-orange-100 text-orange-700' :
                    row.estado === 'Rechazado' ? 'bg-red-100 text-red-700' :
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Mostrando página {safePage} de {totalPages} ({rows.length} resultados)</span>
          <span className="text-slate-300">|</span>
          <label htmlFor="pageSize" className="sr-only">Filas por página</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value) as PageSize); setPage(1) }}
            className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            {[10, 20, 30, 50, 100].map((size) => (
              <option key={size} value={size}>{size} filas</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage(safePage - 1)}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] text-center">
            Página <span className="text-primary font-semibold">{safePage}</span> de <span className="font-semibold">{totalPages}</span>
          </div>
          <button
            onClick={() => setPage(safePage + 1)}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
}

function GlobalTable({ rows, totals, aliadoIds, aliadosMap, isFullscreen, onExitFullscreen }: {
  rows: MatrixRow[]
  totals: MatrixTotals
  aliadoIds: string[]
  aliadosMap: Record<string, string>
  isFullscreen?: boolean
  onExitFullscreen?: () => void
}) {
  const desembolsoIds = useMemo(() => rows.map(r => r.desembolsoId), [rows])
  const desembolsosMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const r of rows) m[r.desembolsoId] = r.desembolsoNombre
    return m
  }, [rows])

  const transposedRows = useMemo(() => {
    return aliadoIds.map(aId => {
      const cells: Record<string, { valorTotal: number; cantidadEventos: number; feeTotal: number }> = {}
      let totalValor = 0
      let totalEventos = 0
      let totalFee = 0
      for (const row of rows) {
        const cell = row.cells[aId]
        if (cell) {
          cells[row.desembolsoId] = {
            valorTotal: cell.valorTotal,
            cantidadEventos: cell.cantidadEventos,
            feeTotal: cell.feeTotal,
          }
          totalValor += cell.valorTotal
          totalEventos += cell.cantidadEventos
          totalFee += cell.feeTotal
        }
      }
      return { aliadoId: aId, aliadoNombre: aliadosMap[aId] || aId, cells, totalValor, totalEventos, totalFee }
    }).filter(r => r.totalEventos > 0)
  }, [rows, aliadoIds, aliadosMap])

  const columnTotals = useMemo(() => {
    const totalsByDesembolso: Record<string, { valor: number; eventos: number; fee: number }> = {}
    for (const dId of desembolsoIds) {
      let valor = 0; let eventos = 0; let fee = 0
      for (const row of transposedRows) {
        const cell = row.cells[dId]
        if (cell) {
          valor += cell.valorTotal
          eventos += cell.cantidadEventos
          fee += cell.feeTotal
        }
      }
      if (eventos > 0) totalsByDesembolso[dId] = { valor, eventos, fee }
    }
    return totalsByDesembolso
  }, [transposedRows, desembolsoIds])

  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(20)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn('')
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) return transposedRows
    const sorted = [...transposedRows]
    sorted.sort((a, b) => {
      let cmp: number
      switch (sortColumn) {
        case 'aliadoNombre':
          cmp = a.aliadoNombre.localeCompare(b.aliadoNombre)
          break
        case 'totalValor':
          cmp = a.totalValor - b.totalValor
          break
        default: {
          const cellA = a.cells[sortColumn]
          const cellB = b.cells[sortColumn]
          cmp = (cellA?.valorTotal ?? 0) - (cellB?.valorTotal ?? 0)
          break
        }
      }
      return sortDirection === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [transposedRows, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, safePage, pageSize])

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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full flex flex-col relative">
      {isFullscreen && onExitFullscreen && (
        <button
          onClick={onExitFullscreen}
          className="absolute top-3 right-3 z-50 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 shadow-sm transition-colors"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          Salir
        </button>
      )}
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <SortHeader column="aliadoNombre" sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>Aliado</SortHeader>
              {desembolsoIds.map((dId) => (
                <SortHeader key={dId} column={dId} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} align="center">
                  {desembolsosMap[dId] || dId}
                </SortHeader>
              ))}
              <th className="sticky top-0 z-10 px-4 py-3.5 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider min-w-[150px] border-l-2 border-slate-300 bg-slate-100 cursor-pointer hover:text-slate-900 select-none" onClick={() => handleSort('totalValor')}>
                <div className="flex items-center justify-center gap-1">
                  Totales
                  {sortColumn === 'totalValor' && sortDirection === 'asc' ? (
                    <ArrowUp className="w-3 h-3 shrink-0" />
                  ) : sortColumn === 'totalValor' && sortDirection === 'desc' ? (
                    <ArrowDown className="w-3 h-3 shrink-0" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 shrink-0 opacity-40" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.map((row, rowIdx) => (
              <tr key={row.aliadoId} className={`transition-colors ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'} hover:bg-blue-50/50`}>
                <td className="px-4 py-3.5 text-sm font-medium text-slate-900">
                  {row.aliadoNombre}
                </td>
                {desembolsoIds.map((dId, colIdx) => {
                  const cell = row.cells[dId]
                  return (
                    <td key={dId} className={`px-4 py-3.5 ${colIdx > 0 ? 'border-l border-slate-100' : 'border-l border-slate-50'} ${cell ? 'group relative cursor-default' : ''}`}>
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
              {desembolsoIds.map((dId, colIdx) => {
                const ct = columnTotals[dId]
                return (
                  <td key={dId} className={`px-4 py-3.5 text-center ${colIdx > 0 ? 'border-l border-slate-200' : 'border-l border-slate-100'}`}>
                    {ct ? (
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-900 tabular-nums">
                          {formatCurrencyCO(ct.valor)}
                        </p>
                        <p className="text-[10px] text-slate-500">{ct.eventos} evento{ct.eventos !== 1 ? 's' : ''}</p>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Mostrando página {safePage} de {totalPages} ({transposedRows.length} resultados)</span>
          <span className="text-slate-300">|</span>
          <label htmlFor="pageSize-global" className="sr-only">Filas por página</label>
          <select
            id="pageSize-global"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value) as PageSize); setPage(1) }}
            className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            {[10, 20, 30, 50, 100].map((size) => (
              <option key={size} value={size}>{size} filas</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Primera página"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage(safePage - 1)}
            disabled={safePage <= 1}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] text-center">
            Página <span className="text-primary font-semibold">{safePage}</span> de <span className="font-semibold">{totalPages}</span>
          </div>
          <button
            onClick={() => setPage(safePage + 1)}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
}
