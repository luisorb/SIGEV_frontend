import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Eye, Pencil, FileDown, RefreshCw, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { Offer, OfferState } from '../types'
import { OFFER_STATES, OFFER_STATE_COLORS } from '../types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { hasQuotedValues } from '../utils/offerValues'

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' | null }) {
  if (active && direction === 'asc') return <ArrowUp className="w-3 h-3 ml-1" />
  if (active && direction === 'desc') return <ArrowDown className="w-3 h-3 ml-1" />
  return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
}

interface OfferListProps {
  offers: Offer[]
  search: string
  onSearchChange: (value: string) => void
  onExport: (id: string) => void
  onChangeState: (id: string, estado: OfferState) => void
  canExport?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canChangeState?: boolean
}

export function OfferList({
  offers,
  search,
  onSearchChange,
  onExport,
  onChangeState,
  canExport = true,
  canCreate = true,
  canEdit = true,
  canChangeState = true,
}: OfferListProps) {
  const [filterEstado, setFilterEstado] = useState('')
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [stateOffer, setStateOffer] = useState<Offer | null>(null)
  const [targetState, setTargetState] = useState<OfferState | ''>('')
  const [pendingState, setPendingState] = useState<OfferState | null>(null)
  const [validationError, setValidationError] = useState('')

  const filterKey = `${search}|${filterEstado}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey)
    setPage(0)
  }

  function handleSort(column: string) {
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

  function openStateChange(offer: Offer) {
    setValidationError('')
    setTargetState('')
    setPendingState(null)
    setStateOffer(offer)
  }

  function confirmTargetState() {
    if (!stateOffer || !targetState) return
    if ((targetState === 'Enviada' || targetState === 'Aprobada') && (!stateOffer.aliado || !stateOffer.desembolso)) {
      setValidationError('La oferta debe tener Aliado y Desembolso asignados para poder ser aprobada.')
      return
    }
    setValidationError('')
    setPendingState(targetState)
  }

  async function confirmStateChange() {
    if (!stateOffer || !pendingState) return
    await onChangeState(stateOffer.id, pendingState)
    setStateOffer(null)
    setPendingState(null)
    setValidationError('')
  }

  const sorted = useMemo(() => {
    let filtered = offers
    if (filterEstado) {
      filtered = filtered.filter((o) => o.estado === filterEstado)
    }
    if (!sortDir) return [...filtered]
    return [...filtered].sort((a, b) => {
      const cmp = sortColumn === 'codigo'
        ? a.codigo.localeCompare(b.codigo)
        : sortColumn === 'nombre'
          ? a.nombre.localeCompare(b.nombre)
          : sortColumn === 'cliente'
            ? a.cliente.localeCompare(b.cliente)
            : sortColumn === 'total'
              ? a.total - b.total
              : sortColumn === 'numeroEvento'
                ? (a.numeroEvento ?? '').localeCompare(b.numeroEvento ?? '')
                : sortColumn === 'estado'
                  ? a.estado.localeCompare(b.estado)
                  : sortColumn === 'items'
                    ? a.items.length - b.items.length
                    : sortColumn === 'createdAt'
                      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [offers, filterEstado, sortColumn, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

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
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre, cliente, evento o responsable..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
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

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => handleSort('codigo')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Código
                    <SortIcon active={sortColumn === 'codigo'} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('numeroEvento')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    N° Evento
                    <SortIcon active={sortColumn === 'numeroEvento'} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nombre')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Nombre
                    <SortIcon active={sortColumn === 'nombre'} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cliente')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Cliente
                    <SortIcon active={sortColumn === 'cliente'} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('estado')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Estado
                    <SortIcon active={sortColumn === 'estado'} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('items')}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center">
                    Items
                    <SortIcon active={sortColumn === 'items'} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total')}
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center justify-end">
                    Total
                    <SortIcon active={sortColumn === 'total'} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
                >
                  <div className="flex items-center justify-end">
                    Fecha
                    <SortIcon active={sortColumn === 'createdAt'} direction={sortDir} />
                  </div>
                </th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                    No hay ofertas para mostrar.
                  </td>
                </tr>
              ) : (
                paged.map((offer) => (
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
                      {hasQuotedValues(offer.items) ? (
                        formatCurrencyCO(offer.total)
                      ) : (
                        <span className="text-slate-400 italic font-normal">Pendiente por cotizar</span>
                      )}
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
                        {canChangeState && (
                          <button
                            onClick={() => openStateChange(offer)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Cambiar estado"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
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
        {sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Mostrando página {safePage + 1} de {totalPages} ({sorted.length} resultados)</span>
            <span className="text-slate-300">|</span>
            <label htmlFor="offers-pageSize" className="sr-only">Filas por página</label>
            <select
              id="offers-pageSize"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)) }}
              className="px-2 py-1 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
            >
              {[5, 10, 15, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size}>{size} filas</option>
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

      {stateOffer && !pendingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">Cambiar estado</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Oferta {stateOffer.codigo} · Estado actual:{' '}
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ml-1 ${OFFER_STATE_COLORS[stateOffer.estado]}`}>
                    {stateOffer.estado}
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-2">Selecciona el nuevo estado de la oferta:</p>
                {validationError && (
                  <p className="text-sm text-red-600 mt-3">{validationError}</p>
                )}
                <div className="mt-4">
                  <select
                    value={targetState}
                    onChange={(e) => {
                      setTargetState(e.target.value as OfferState)
                      setValidationError('')
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Seleccione el estado...</option>
                    {OFFER_STATES.filter((s) => s !== stateOffer.estado).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => setStateOffer(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setStateOffer(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmTargetState}
                disabled={!targetState}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingState && stateOffer && !validationError && (
        <ConfirmDialog
          isOpen
          title="Cambiar estado"
          message={`¿Estás seguro de cambiar la oferta ${stateOffer.codigo} de ${stateOffer.estado} a ${pendingState}?`}
          confirmLabel={`Cambiar a ${pendingState}`}
          cancelLabel="Cancelar"
          variant={pendingState === 'Rechazada' ? 'danger' : 'warning'}
          onConfirm={confirmStateChange}
          onCancel={() => setPendingState(null)}
        />
      )}
    </div>
  )
}
