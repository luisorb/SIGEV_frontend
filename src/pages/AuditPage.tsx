import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardList } from 'lucide-react'
import { getAllAuditEntries } from '../lib/auditStore'
import { formatDateCO } from '../utils/formatters'
import type { AuditEntry } from '../types'

const ENTIDADES = ['', 'Event', 'Offer', 'Item', 'Ally', 'User', 'Param']
const ACCIONES = ['', 'Creación', 'Actualización', 'Eliminación', 'Cambio de estado']

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' | null }) {
  if (active && direction === 'asc') return <ArrowUp className="w-3 h-3 ml-1 shrink-0" />
  if (active && direction === 'desc') return <ArrowDown className="w-3 h-3 ml-1 shrink-0" />
  return <ArrowUpDown className="w-3 h-3 ml-1 shrink-0 opacity-40" />
}

const SORTABLE_COLUMNS = ['fecha', 'usuario', 'accion', 'entidad', 'entidadId', 'detalle'] as const
type SortColumn = (typeof SORTABLE_COLUMNS)[number]

export function AuditPage() {
  const [search, setSearch] = useState('')
  const [filterEntidad, setFilterEntidad] = useState('')
  const [filterAccion, setFilterAccion] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)

  function handleSort(column: SortColumn) {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortColumn('')
      setSortDir(null)
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = getAllAuditEntries()

    if (filterEntidad) result = result.filter((e) => e.entidad === filterEntidad)
    if (filterAccion) result = result.filter((e) => e.accion.startsWith(filterAccion))

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.usuario.toLowerCase().includes(q) ||
          e.accion.toLowerCase().includes(q) ||
          e.entidad.toLowerCase().includes(q) ||
          e.entidadId.toLowerCase().includes(q) ||
          e.detalle.toLowerCase().includes(q) ||
          formatDateCO(e.fecha).toLowerCase().includes(q),
      )
    }

    if (!sortDir) return result

    return [...result].sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case 'fecha':
          cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          break
        case 'usuario':
          cmp = a.usuario.localeCompare(b.usuario)
          break
        case 'accion':
          cmp = a.accion.localeCompare(b.accion)
          break
        case 'entidad':
          cmp = a.entidad.localeCompare(b.entidad)
          break
        case 'entidadId':
          cmp = a.entidadId.localeCompare(b.entidadId)
          break
        case 'detalle':
          cmp = a.detalle.localeCompare(b.detalle)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filterEntidad, filterAccion, search, sortColumn, sortDir])

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filteredAndSorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  return (
    <div className="space-y-4">
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Auditoría</h1>
        </div>
        <p className="text-sm text-slate-500">Registro de actividades y trazabilidad del sistema</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, entidad, detalle..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={filterEntidad}
          onChange={(e) => { setFilterEntidad(e.target.value); setPage(0) }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">Todas las entidades</option>
          {ENTIDADES.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={filterAccion}
          onChange={(e) => { setFilterAccion(e.target.value); setPage(0) }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">Todas las acciones</option>
          {ACCIONES.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[calc(100vh-14rem)]">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th onClick={() => handleSort('fecha')} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                  <div className="flex items-center">Fecha <SortIcon active={sortColumn === 'fecha'} direction={sortDir} /></div>
                </th>
                <th onClick={() => handleSort('usuario')} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                  <div className="flex items-center">Usuario <SortIcon active={sortColumn === 'usuario'} direction={sortDir} /></div>
                </th>
                <th onClick={() => handleSort('accion')} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                  <div className="flex items-center">Acción <SortIcon active={sortColumn === 'accion'} direction={sortDir} /></div>
                </th>
                <th onClick={() => handleSort('entidad')} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                  <div className="flex items-center">Entidad <SortIcon active={sortColumn === 'entidad'} direction={sortDir} /></div>
                </th>
                <th onClick={() => handleSort('entidadId')} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                  <div className="flex items-center">ID <SortIcon active={sortColumn === 'entidadId'} direction={sortDir} /></div>
                </th>
                <th onClick={() => handleSort('detalle')} className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700 select-none whitespace-nowrap">
                  <div className="flex items-center">Detalle <SortIcon active={sortColumn === 'detalle'} direction={sortDir} /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-400">
                    No hay registros de auditoría.
                  </td>
                </tr>
              ) : (
                paged.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDateCO(entry.fecha)}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{entry.usuario}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{entry.accion}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{entry.entidad}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-slate-600 font-mono whitespace-nowrap">{entry.entidadId}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-slate-600">{entry.detalle}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAndSorted.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Mostrando página {safePage + 1} de {totalPages} ({filteredAndSorted.length} resultados)</span>
              <span className="text-slate-300">|</span>
              <label htmlFor="audit-pageSize" className="sr-only">Filas por página</label>
              <select
                id="audit-pageSize"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
                className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                {[5, 10, 15, 20, 30, 50, 100].map((s) => (
                  <option key={s} value={s}>{s} filas</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={safePage === 0}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 0}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] text-center">
                Página <span className="text-primary font-semibold">{safePage + 1}</span> de <span className="font-semibold">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={safePage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
