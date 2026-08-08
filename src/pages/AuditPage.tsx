import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { Search, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ClipboardList, Loader2 } from 'lucide-react'
import { getAllAuditEntries } from '../lib/auditStore'
import { getAuditApi } from '../services/audit.service'
import { formatDateCO } from '../utils/formatters'
import { SearchableSelect } from '../components/SearchableSelect'

const ENTIDADES = ['', 'Event', 'Offer', 'Item', 'Ally', 'User', 'Param']
const ACCIONES = ['', 'Creación', 'Actualización', 'Eliminación', 'Cambio de estado']

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' | null }) {
  if (active && direction === 'asc') return <ArrowUp className="w-3 h-3 ml-1 shrink-0" />
  if (active && direction === 'desc') return <ArrowDown className="w-3 h-3 ml-1 shrink-0" />
  return <ArrowUpDown className="w-3 h-3 ml-1 shrink-0 opacity-40" />
}

type SortColumn = 'fecha' | 'usuario' | 'accion' | 'entidad' | 'entidadId' | 'detalle'

export function AuditPage() {
  const [search, setSearch] = useState('')
  const [filterEntidad, setFilterEntidad] = useState('')
  const [filterAccion, setFilterAccion] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn | ''>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(0)

  const {
    data: serverPage = { data: [], total: 0, page: 0, pageSize, totalPages: 0 },
    isPending,
    isFetching,
  } = useQuery({
    queryKey: ['audit', page, pageSize, search, filterEntidad, filterAccion, sortColumn, sortDir],
    queryFn: () =>
      getAuditApi({
        page,
        pageSize,
        search,
        entidad: filterEntidad || undefined,
        accion: filterAccion || undefined,
        sortBy: sortColumn || undefined,
        sortDir: sortDir ?? undefined,
      }),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  })

  function handleSort(column: SortColumn) {
    setPage(0)
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

  const localEntries = useMemo(() => {
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

    return [...result].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    )
  }, [filterEntidad, filterAccion, search])

  const totalCount = (serverPage.total ?? 0) + localEntries.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages - 1)

  const rows = useMemo(() => {
    const serverRows = serverPage.data ?? []
    if (safePage === 0) {
      const localRows = localEntries.slice(0, pageSize)
      const remaining = pageSize - localRows.length
      return [...localRows, ...serverRows.slice(0, Math.max(0, remaining))]
    }
    return serverRows
  }, [safePage, localEntries, serverPage.data, pageSize])

  return (
    <div className="space-y-4">
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Auditoría</h1>
        </div>
        <p className="text-sm text-slate-500">Registro de actividades y trazabilidad del sistema</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, entidad, detalle..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-slate-50 transition-colors ${
            showFilters ? 'ring-2 ring-primary/30 border-primary' : ''
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          Filtros
        </button>
        {showFilters && (
          <>
            <SearchableSelect
              size="sm"
              className="w-40"
              options={ENTIDADES.filter(Boolean).map((e) => ({ value: e, label: e }))}
              value={filterEntidad}
              onChange={(v) => { setFilterEntidad(v); setPage(0) }}
              placeholder="Todas las entidades"
            />
            <SearchableSelect
              size="sm"
              className="w-44"
              options={ACCIONES.filter(Boolean).map((a) => ({ value: a, label: a }))}
              value={filterAccion}
              onChange={(v) => { setFilterAccion(v); setPage(0) }}
              placeholder="Todas las acciones"
            />
          </>
        )}
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
              {isPending && rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando registros...
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-400">
                    No hay registros de auditoría.
                  </td>
                </tr>
              ) : (
                rows.map((entry) => (
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

        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Mostrando página {safePage + 1} de {totalPages} ({totalCount} resultados)</span>
              {isFetching && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              )}
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
