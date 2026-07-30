import { useState, useMemo } from 'react'
import { Search, ArrowLeftToLine, Check, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { ParamVersion } from '../types'
import { formatDateCO } from '../../../utils/formatters'

interface ParameterHistoryTableProps {
  versions: ParamVersion[]
  currentVersionId: string | null
  onLoadVersion: (id: string) => void
}

type SortColumn = 'version' | 'fechaCreacion' | 'aprobadoPor' | 'ivaRate' | 'impuestoConsumoRate' | 'feeTarifadoRate' | 'feeTercerosRate' | 'ivaFeeRate'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 8

function SortIcon({ active, direction }: { active: boolean; direction: SortDir | null }) {
  if (active && direction === 'asc') return <ArrowUp className="w-3 h-3 shrink-0" />
  if (active && direction === 'desc') return <ArrowDown className="w-3 h-3 shrink-0" />
  return <ArrowUpDown className="w-3 h-3 shrink-0 opacity-40" />
}

export function ParameterHistoryTable({ versions, currentVersionId, onLoadVersion }: ParameterHistoryTableProps) {
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('version')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const currentVersion = useMemo(() => versions.find((v) => v.id === currentVersionId) ?? null, [versions, currentVersionId])

  function toggleSort(col: SortColumn) {
    if (sortColumn === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortColumn(col)
      setSortDir('asc')
    }
    setPage(0)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return versions
    const q = search.toLowerCase()
    return versions.filter((v) =>
      `v${v.version}`.includes(q) ||
      v.aprobadoPor.toLowerCase().includes(q) ||
      v.fechaCreacion.toLowerCase().includes(q) ||
      (v.params.ivaRate * 100).toFixed(2).includes(q) ||
      (v.params.impuestoConsumoRate * 100).toFixed(2).includes(q) ||
      (v.params.feeTarifadoRate * 100).toFixed(2).includes(q) ||
      (v.params.feeTercerosRate * 100).toFixed(2).includes(q) ||
      (v.params.ivaFeeRate * 100).toFixed(2).includes(q)
    )
  }, [versions, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const cmp = sortColumn === 'version'
        ? a.version - b.version
        : sortColumn === 'fechaCreacion'
          ? new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
          : sortColumn === 'aprobadoPor'
            ? a.aprobadoPor.localeCompare(b.aprobadoPor)
            : sortColumn === 'ivaRate'
              ? a.params.ivaRate - b.params.ivaRate
              : sortColumn === 'impuestoConsumoRate'
                ? a.params.impuestoConsumoRate - b.params.impuestoConsumoRate
                : sortColumn === 'feeTarifadoRate'
                  ? a.params.feeTarifadoRate - b.params.feeTarifadoRate
                  : sortColumn === 'feeTercerosRate'
                    ? a.params.feeTercerosRate - b.params.feeTercerosRate
                    : a.params.ivaFeeRate - b.params.ivaFeeRate
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortColumn, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const sortHeader = (col: SortColumn, label: string, className = '') => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none ${className}`}
    >
      <div className="flex items-center gap-0.5">
        {label}
        <SortIcon active={sortColumn === col} direction={sortColumn === col ? sortDir : null} />
      </div>
    </th>
  )

  return (
    <div className="bg-white">
      {currentVersion && (
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2 text-xs text-slate-500">
          <Check className="w-3.5 h-3.5 text-green-500" />
          Versión actualmente cargada: <span className="font-semibold text-slate-700">v{currentVersion.version}</span>
          <span className="text-slate-300 mx-1">|</span>
          {formatDateCO(currentVersion.fechaCreacion)}
          <span className="text-slate-300 mx-1">·</span>
          {currentVersion.aprobadoPor}
        </div>
      )}

      <div className="px-6 py-3 border-b border-slate-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar en historial..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="p-10 text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">No hay versiones registradas</p>
          <p className="text-xs text-slate-300 mt-1">Las versiones de parámetros aparecerán aquí al guardar cambios.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  {sortHeader('version', 'Versión')}
                  {sortHeader('fechaCreacion', 'Fecha')}
                  {sortHeader('aprobadoPor', 'Aprobado por')}
                  {sortHeader('ivaRate', 'IVA')}
                  {sortHeader('impuestoConsumoRate', 'Consumo')}
                  {sortHeader('feeTarifadoRate', 'Fee Tarif.')}
                  {sortHeader('feeTercerosRate', 'Fee 3ros')}
                  {sortHeader('ivaFeeRate', 'IVA Fee')}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((v) => {
                  const isLoaded = v.id === currentVersionId
                  return (
                    <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${isLoaded ? 'bg-primary/[0.02]' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLoaded && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" title="Versión cargada" />
                          )}
                          <span className={`font-mono text-sm font-medium ${isLoaded ? 'text-primary' : 'text-slate-900'}`}>
                            v{v.version}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDateCO(v.fechaCreacion)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{v.aprobadoPor}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium tabular-nums">{(v.params.ivaRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium tabular-nums">{(v.params.impuestoConsumoRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium tabular-nums">{(v.params.feeTarifadoRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium tabular-nums">{(v.params.feeTercerosRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-slate-600 font-medium tabular-nums">{(v.params.ivaFeeRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onLoadVersion(v.id)}
                          disabled={isLoaded}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          title="Cargar esta versión en el formulario"
                        >
                          <ArrowLeftToLine className="w-3 h-3" />
                          Cargar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/30">
              <p className="text-xs text-slate-500">
                {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <span className="text-xs font-medium text-slate-600 tabular-nums min-w-[4rem] text-center">{safePage + 1} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage === totalPages - 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
