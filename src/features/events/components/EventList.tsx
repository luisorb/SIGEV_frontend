import { useState } from 'react'
import { Search, ChevronUp, ChevronDown, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import type { Event, Municipality } from '../../../types'
import type { Ally, Disbursement } from '../../../types'
import type { EventListFilters, EventListSort, EventListMeta } from '../types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { EVENT_STATES } from '../../../config/constants'

const stateColors: Record<string, string> = {
  Abierto: 'bg-yellow-100 text-yellow-800',
  'En ejecucion': 'bg-blue-100 text-blue-800',
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
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
  filters: EventListFilters
  sort: EventListSort
  meta: EventListMeta
  onFilterChange: (key: keyof EventListFilters, value: string) => void
  onSort: (column: string) => void
  onPageChange: (page: number) => void
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onCreate: () => void
}

export function EventList({
  events: _events,
  aliados,
  desembolsos,
  municipios,
  filters,
  sort,
  meta,
  onFilterChange,
  onSort,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onCreate,
}: EventListProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const municipiosMap = Object.fromEntries(municipios.map((m) => [m.id, m.nombre]))

  const totalItems = _events.reduce((sum, e) => sum + e.items.length, 0)
  const totalValue = _events.reduce((sum, e) => {
    const itemSum = e.items.reduce((s, i) => s + i.total, 0)
    return sum + itemSum
  }, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Órdenes</h1>
          <p className="text-sm text-slate-500">
            {meta.total} eventos · {totalItems} ítems · Total {formatCurrencyCO(totalValue)}
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número de evento o responsable..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            showFilters || filters.estado || filters.aliadoId || filters.desembolsoId || filters.municipioId
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <select
            value={filters.estado}
            onChange={(e) => onFilterChange('estado', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {EVENT_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filters.municipioId}
            onChange={(e) => onFilterChange('municipioId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los municipios</option>
            {municipios.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
          <select
            value={filters.aliadoId}
            onChange={(e) => onFilterChange('aliadoId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los aliados</option>
            {aliados.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
          <select
            value={filters.desembolsoId}
            onChange={(e) => onFilterChange('desembolsoId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los desembolsos</option>
            {desembolsos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <SortHeader column="numeroEvento" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Evento</SortHeader>
                <SortHeader column="responsable" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Responsable</SortHeader>
                <SortHeader column="fechaEvento" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Fecha</SortHeader>
                <SortHeader column="estado" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Estado</SortHeader>
                <SortHeader column="municipioId" sortColumn={sort.column} sortDirection={sort.direction} onSort={onSort}>Municipio</SortHeader>
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
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                    No hay órdenes registradas. Crea la primera orden.
                  </td>
                </tr>
              ) : (
                _events.map((event) => {
                  const eventTotal = event.items.reduce((s, i) => s + i.total, 0)
                  const aliado = aliados.find((a) => a.id === event.aliadoId)
                  const desembolso = desembolsos.find((d) => d.id === event.desembolsoId)
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
                      <td className="px-4 py-3 text-sm text-slate-600">{municipiosMap[event.municipioId] ?? event.municipioId}</td>
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
                            onClick={() => onView(event.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(event.id)}
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

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-500">
              Mostrando página {meta.page} de {meta.totalPages} ({meta.filtered} resultados)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => onPageChange(meta.page - 1)}
                disabled={meta.page <= 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    p === meta.page
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => onPageChange(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
