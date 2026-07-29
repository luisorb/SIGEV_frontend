import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Eye, Pencil, FileDown, ArrowUpDown } from 'lucide-react'
import type { Offer } from '../types'
import { OFFER_STATES, OFFER_STATE_COLORS } from '../types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'

function SortIcon() {
  return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
}

interface OfferListProps {
  offers: Offer[]
  search: string
  onSearchChange: (value: string) => void
  onExport: (id: string) => void
  canExport?: boolean
  canCreate?: boolean
  canEdit?: boolean
}

export function OfferList({
  offers,
  search,
  onSearchChange,
  onExport,
  canExport = true,
  canCreate = true,
  canEdit = true,
}: OfferListProps) {
  const [filterEstado, setFilterEstado] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDir('desc')
    }
  }

  let filtered = offers
  if (filterEstado) {
    filtered = filtered.filter((o) => o.estado === filterEstado)
  }

  const sorted = [...filtered].sort((a, b) => {
    const cmp = sortColumn === 'codigo'
      ? a.codigo.localeCompare(b.codigo)
      : sortColumn === 'nombre'
        ? a.nombre.localeCompare(b.nombre)
        : sortColumn === 'cliente'
          ? a.cliente.localeCompare(b.cliente)
          : sortColumn === 'total'
            ? a.total - b.total
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ofertas Económicas</h1>
          <p className="text-sm text-slate-500">{offers.length} ofertas registradas</p>
        </div>
        {canCreate && (
          <Link
            to="/ofertas/nueva"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Oferta
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, cliente, evento o responsable..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
        >
          <option value="">Todos los estados</option>
          {OFFER_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('codigo')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Código
                    <SortIcon />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  N° Evento
                </th>
                <th
                  onClick={() => handleSort('nombre')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Nombre
                    <SortIcon />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cliente')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Cliente
                    <SortIcon />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Items
                </th>
                <th
                  onClick={() => handleSort('total')}
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center justify-end">
                    Total
                    <SortIcon />
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                    No hay ofertas para mostrar.
                  </td>
                </tr>
              ) : (
                sorted.map((offer) => (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{offer.codigo}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{offer.numeroEvento || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate" title={offer.nombre}>{offer.nombre}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{offer.cliente}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${OFFER_STATE_COLORS[offer.estado]}`}>
                        {offer.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{offer.items.length}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-slate-900">
                      {formatCurrencyCO(offer.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 text-right">
                      {formatDateCO(offer.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/ofertas/${offer.id}`}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canEdit && (
                          <Link
                            to={`/ofertas/${offer.id}/editar`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                        )}
                        {canExport && (
                          <button
                            onClick={() => onExport(offer.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-green-600 transition-colors"
                            title="Exportar a Excel"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
