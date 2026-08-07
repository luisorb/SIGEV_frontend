import { useMemo, useState } from 'react'
import { FileSpreadsheet, Plus, CheckCircle, Circle, FileDown, BadgeCheck, Download } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import type { Offer } from '../../offers/types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { OFFER_STATE_COLORS } from '../../offers/types'
import { hasQuotedValues } from '../../offers/utils/offerValues'
import { QUOTATIONS_KEY } from '../../offers/hooks/useQuotations'
import type { Event } from '../../../types'
import { downloadAttachment } from '../../../services/attachments.service'
import { QuotationRegistrationModal } from './QuotationRegistrationModal'
import { QuotationDetailModal } from './QuotationDetailModal'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { useToast } from '../../../components/ToastProvider'

interface QuotationListProps {
  eventoId: string
  event: Event
  offers: Offer[]
  selectedOfferId?: string
  onSelectOffer?: (offerId: string) => void
  readOnly?: boolean
  canSelectQuotation?: boolean
  oferta?: Offer | null
}

export function QuotationList({
  eventoId,
  event,
  offers,
  selectedOfferId,
  onSelectOffer,
  readOnly = false,
  canSelectQuotation = false,
  oferta,
}: QuotationListProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [detailOffer, setDetailOffer] = useState<Offer | null>(null)
  const [confirmOffer, setConfirmOffer] = useState<Offer | null>(null)

  const eventOffers = useMemo(() => offers.filter((o) => o.eventoId === eventoId), [offers, eventoId])
  const quotationsCount = event.quotations?.length ?? eventOffers.length

  const canSelect = canSelectQuotation && eventOffers.length >= 3

  const presupuestoAttachment = event.attachments?.find((a) => a.category === 'Presupuesto final')

  function handleSaved(notice?: string) {
    queryClient.invalidateQueries({ queryKey: QUOTATIONS_KEY })
    queryClient.invalidateQueries({ queryKey: ['event', eventoId] })
    queryClient.invalidateQueries({ queryKey: ['events'] })
    addAuditEntry({
      accion: 'Registro de cotización',
      entidad: 'Quotation',
      entidadId: eventoId,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Cotización registrada para el evento ${event.numeroEvento}`,
    })
    if (notice) {
      toast.showToast(notice, 'error')
    } else {
      toast.showToast('Cotización registrada correctamente')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Listado de cotizaciones
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {eventOffers.length} de 3 cotizaciones requeridas
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva cotización
          </button>
        )}
      </div>

      {oferta && (
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Oferta económica definitiva
              </p>
              <p className="text-sm font-semibold text-emerald-900 truncate">
                {oferta.codigo} · {formatCurrencyCO(oferta.total)}
              </p>
            </div>
          </div>
          {presupuestoAttachment && (
            <button
              onClick={() => {
                downloadAttachment(presupuestoAttachment.id, presupuestoAttachment.originalName)
                addAuditEntry({
                  accion: 'Descarga del presupuesto final',
                  entidad: 'Attachment',
                  entidadId: presupuestoAttachment.id,
                  usuario: getCurrentUser(),
                  fecha: new Date().toISOString(),
                  detalle: `Presupuesto final "${presupuestoAttachment.originalName}" descargado del evento ${event.numeroEvento}`,
                })
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shrink-0"
              title="Descargar presupuesto final (Carpeta 4)"
            >
              <Download className="w-3.5 h-3.5" />
              Presupuesto final
            </button>
          )}
        </div>
      )}

      {eventOffers.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay cotizaciones registradas para esta orden</p>
          <p className="text-xs text-slate-300 mt-1">Use el botón "Nueva cotización" para valorar los ítems de la orden</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {eventOffers.map((offer) => {
            const isSelected = offer.id === selectedOfferId

            return (
              <div key={offer.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {!oferta && (
                    <button
                      onClick={() => setConfirmOffer(offer)}
                      disabled={!canSelect || isSelected}
                      className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : canSelect
                            ? 'border-slate-300 hover:border-primary cursor-pointer'
                            : 'border-slate-200 cursor-default'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-4 h-4" />}
                      {!isSelected && <Circle className="w-3 h-3 opacity-0" />}
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDetailOffer(offer)}
                        className="text-sm font-medium text-primary hover:text-primary-dark truncate text-left transition-colors"
                        title="Ver detalle"
                      >
                        {offer.codigo}
                      </button>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${OFFER_STATE_COLORS[isSelected ? 'Aprobada' : offer.estado]}`}>
                        {isSelected ? 'Aprobada' : offer.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {offer.nombre} · {offer.cliente} · {offer.items.length} ítems
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    {hasQuotedValues(offer.items) ? (
                      <p className="text-sm font-semibold text-slate-900">{formatCurrencyCO(offer.total)}</p>
                    ) : (
                      <p className="text-sm font-normal italic text-slate-400">Pendiente por cotizar</p>
                    )}
                    <p className="text-[10px] text-slate-400">{formatDateCO(offer.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailOffer(offer)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                      title="Ver detalle"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>
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

      {showModal && (
        <QuotationRegistrationModal
          event={event}
          quotationsCount={quotationsCount}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {detailOffer && (
        <QuotationDetailModal offer={detailOffer} event={event} onClose={() => setDetailOffer(null)} />
      )}

      {confirmOffer && (
        <ConfirmDialog
          isOpen
          title="Seleccionar cotización"
          message={`¿Está seguro de seleccionar la cotización ${confirmOffer.codigo} por ${formatCurrencyCO(confirmOffer.total)} para crear la oferta económica definitiva? Esta acción marcará la cotización como ganadora y generará el presupuesto final.`}
          confirmLabel="Sí, seleccionar"
          cancelLabel="Cancelar"
          variant="warning"
          onConfirm={() => {
            onSelectOffer?.(confirmOffer.id)
            setConfirmOffer(null)
          }}
          onCancel={() => setConfirmOffer(null)}
        />
      )}
    </div>
  )
}
