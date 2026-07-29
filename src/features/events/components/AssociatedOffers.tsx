import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileSpreadsheet, Plus, CheckCircle, Circle, FileDown, Printer } from 'lucide-react'
import type { Offer } from '../../offers/types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { OFFER_STATE_COLORS } from '../../offers/types'

interface AssociatedOffersProps {
  eventoId: string
  offers: Offer[]
  selectedOfferId?: string
  onSelectOffer?: (offerId: string) => void
  onExportPDF?: (offerId: string) => void
  readOnly?: boolean
}

export function AssociatedOffers({
  eventoId,
  offers,
  selectedOfferId,
  onSelectOffer,
  onExportPDF,
  readOnly = false,
}: AssociatedOffersProps) {
  const eventOffers = useMemo(() => offers.filter((o) => o.eventoId === eventoId), [offers, eventoId])

  const canSelect = !readOnly && eventOffers.length >= 3

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Ofertas Económicas Asociadas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {eventOffers.length} oferta{eventOffers.length !== 1 ? 's' : ''} de {eventOffers.length < 3 ? '3' : ''} requeridas
          </p>
        </div>
        {!readOnly && (
          <Link
            to={`/ofertas/nueva?eventoId=${eventoId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Oferta
          </Link>
        )}
      </div>

      {eventOffers.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay ofertas asociadas a este evento</p>
          <p className="text-xs text-slate-300 mt-1">Cree ofertas desde el botón "Nueva Oferta"</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {eventOffers.map((offer) => {
            const isSelected = offer.id === selectedOfferId
            const isApproved = offer.estado === 'Aprobada'

            return (
              <div key={offer.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => onSelectOffer?.(offer.id)}
                    disabled={!canSelect || isSelected || readOnly}
                    className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-white'
                        : canSelect && !readOnly
                          ? 'border-slate-300 hover:border-primary cursor-pointer'
                          : 'border-slate-200 cursor-default'
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-4 h-4" />}
                    {!isSelected && <Circle className="w-3 h-3 opacity-0" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/ofertas/${offer.id}`} className="text-sm font-medium text-primary hover:text-primary-dark truncate">
                        {offer.codigo}
                      </Link>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${OFFER_STATE_COLORS[offer.estado]}`}>
                        {offer.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {offer.nombre} · {offer.cliente} · {offer.items.length} ítems
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrencyCO(offer.total)}</p>
                    <p className="text-[10px] text-slate-400">{formatDateCO(offer.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isApproved && onExportPDF && (
                      <button
                        onClick={() => onExportPDF(offer.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                        title="Exportar PDF presupuesto"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <Link
                      to={`/ofertas/${offer.id}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                      title="Ver detalle"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {eventOffers.length > 0 && eventOffers.length < 3 && !readOnly && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700">
            Se requieren al menos 3 cotizaciones. Actualmente hay {eventOffers.length}.
          </p>
        </div>
      )}

      {selectedOfferId && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-700 font-medium">
            Oferta seleccionada: {eventOffers.find((o) => o.id === selectedOfferId)?.codigo}
          </p>
        </div>
      )}
    </div>
  )
}
