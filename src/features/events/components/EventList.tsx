import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import type { Event } from '../../../types'
import type { EventListFilters, EventListSort, EventListMeta } from '../types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { EVENT_STATES } from '../../../config/constants'
import { mockAliados, mockDesembolsos, mockMunicipios } from '../utils/mockData'
import type { PageSize } from '../hooks/useEventList'

const stateColors: Record<string, string> = {
  Abierto: 'bg-yellow-100 text-yellow-800',
  'En ejecucion': 'bg-red-100 text-red-800',
  Ejecutado: 'bg-green-100 text-green-800',
  Cerrado: 'bg-slate-100 text-slate-800',
  Legalizado: 'bg-purple-100 text-purple-800',
}

interface SortHeaderProps {
  column: string
  sortColumn: string
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
  children: React.ReactNode
}

function SortHeader({ column, sortColumn, sortDirection, onSort, children }: SortHeaderProps) {
  const isActive = sortColumn === column
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {isActive && (
          sortDirection === 'asc'
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
        )}
      </div>
    </th>
  )
}

interface EventListProps {
  events: Event[]
  filters: EventListFilters
  sort: EventListSort
  meta: EventListMeta
  onFilterChange: (key: keyof EventListFilters, value: string) => void
  onSort: (column: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
  onDelete: (id: string) => void
}

export function EventList({
  events: _events,
  filters,
  sort,
  meta,
  onFilterChange,
  onSort,
  onPageChange,
  onPageSizeChange,
  onDelete,
}: EventListProps) {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const totalItems = _events.reduce((sum, e) => sum + e.items.length, 0)
  const totalValue = _events.reduce((sum, e) => {
    const itemSum = e.items.reduce((s, i) => s + i.total, 0)
    return sum + itemSum
  }, 0)

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
          <p className="text-sm text-slate-500">
            {meta.total} eventos · {totalItems} ítems · Total {formatCurrencyCO(totalValue)}
          </p>
        </div>
        <button
          onClick={() => navigate('/ordenes/nueva')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número de evento o responsable..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors shrink-0 ${
            showFilters || filters.estado || filters.aliadoId || filters.desembolsoId || filters.municipioId
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
          <select
            value={filters.estado}
            onChange={(e) => onFilterChange('estado', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los estados</option>
            {EVENT_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.municipioId}
            onChange={(e) => onFilterChange('municipioId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los municipios</option>
            {mockMunicipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          <select
            value={filters.aliadoId}
            onChange={(e) => onFilterChange('aliadoId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los aliados</option>
            {mockAliados.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <select
            value={filters.desembolsoId}
            onChange={(e) => onFilterChange('desembolsoId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos los desembolsos</option>
            {mockDesembolsos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex-1 flex flex-col">

        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <SortHeader column="numeroEvento" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Evento</SortHeader>
                <SortHeader column="responsable" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Responsable</SortHeader>
                <SortHeader column="fechaEvento" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Fecha</SortHeader>
                <SortHeader column="estado" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Estado</SortHeader>
                <SortHeader column="aliadoId" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Aliado</SortHeader>
                <SortHeader column="desembolsoId" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Desembolso</SortHeader>
                <SortHeader column="esquema" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Esquema</SortHeader>
                <SortHeader column="itemsCount" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Ítems</SortHeader>
                <SortHeader column="totalCalculado" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Total</SortHeader>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {_events.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No hay órdenes registradas. Crea la primera orden.
                  </td>
                </tr>
              ) : (
                _events.map((event) => {
                  const eventTotal = event.items.reduce((s, i) => s + i.total, 0)
                  const aliado = mockAliados.find((a) => a.id === event.aliadoId)
                  const desembolso = mockDesembolsos.find((d) => d.id === event.desembolsoId)
                  return (
                    <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {event.numeroEvento}{event.sufijo ? `-${event.sufijo}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{event.responsable}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{event.fechaEvento ? formatDateCO(event.fechaEvento) : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${stateColors[event.estado] || ''}`}>
                          {event.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{aliado?.nombre ?? event.aliadoId}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{desembolso?.nombre ?? event.desembolsoId}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 capitalize">{event.esquema}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{event.items.length}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {formatCurrencyCO(eventTotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/ordenes/${event.id}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/ordenes/${event.id}/editar`)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirmId === event.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { onDelete(event.id); setDeleteConfirmId(null) }}
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(event.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Mostrando página {meta.page} de {meta.totalPages} ({meta.filtered} resultados)</span>
              <span className="text-slate-300">|</span>
              <label htmlFor="pageSize" className="sr-only">Filas por página</label>
              <select
                id="pageSize"
                value={meta.pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
                className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              >
                {[10, 20, 30, 50, 100].map((size) => (
                  <option key={size} value={size}>{size} filas</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Primera página"
              >
                <ChevronsLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onPageChange(meta.page - 1)}
                disabled={meta.page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 min-w-[120px] text-center">
                Página <span className="text-primary font-semibold">{meta.page}</span> de <span className="font-semibold">{meta.totalPages}</span>
              </div>
              <button
                onClick={() => onPageChange(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onPageChange(meta.totalPages)}
                disabled={meta.page >= meta.totalPages}
                className="p-1.5 rounded-lg border border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
      </div>
    </div>
  )
}
