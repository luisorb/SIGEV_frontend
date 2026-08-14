import { useMemo, useState, useRef } from 'react'
import { FileSpreadsheet, Plus, BadgeCheck, ClipboardCheck, Download, FileUp, X, Eye } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
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

const MAX_APROBACION_MB = 10
const MAX_APROBACION_BYTES = MAX_APROBACION_MB * 1024 * 1024

function getApprovalFileError(file: File): string | null {
  const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'El comunicado de aprobación debe ser un archivo PDF'
  if (file.size > MAX_APROBACION_BYTES) {
    return `El documento PDF no puede superar los ${MAX_APROBACION_MB} MB`
  }
  return null
}

interface QuotationListProps {
  eventoId: string
  event: Event
  offers: Offer[]
  selectedOfferId?: string
  onSelectOffer?: (offerId: string, file?: File, itemIds?: string[]) => void
  onValidateOffer?: (offerId: string) => void
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
  onValidateOffer,
  readOnly = false,
  canSelectQuotation = false,
  oferta,
}: QuotationListProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [detailOffer, setDetailOffer] = useState<Offer | null>(null)
  const [confirmOffer, setConfirmOffer] = useState<Offer | null>(null)
  const [validateOffer, setValidateOffer] = useState<Offer | null>(null)
  const [approvalFile, setApprovalFile] = useState<File | null>(null)
  const [approvalFileError, setApprovalFileError] = useState<string | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({})
  const approvalInputRef = useRef<HTMLInputElement | null>(null)

  const eventOffers = useMemo(() => offers.filter((o) => o.eventoId === eventoId), [offers, eventoId])
  const quotationsCount = event.quotations?.length ?? eventOffers.length

  const canSelect = canSelectQuotation && eventOffers.length >= 1

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
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            <FileSpreadsheet className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Listado de cotizaciones
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {eventOffers.length} cotización{eventOffers.length !== 1 ? 'es' : ''} registrada{eventOffers.length !== 1 ? 's' : ''} · se requieren 3 para cerrar el evento
            </p>
          </div>
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Fecha de subida
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventOffers.map((offer) => {
                const isSelected = offer.id === selectedOfferId
                const displayEstado: Offer['estado'] = isSelected ? 'Aprobada' : offer.estado
                const canValidate =
                  canSelect && !isSelected && (offer.estado === 'Borrador' || offer.estado === 'Enviada')
                const canApprove = canSelect && !isSelected && offer.estado === 'Validada'

                return (
                  <tr key={offer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{offer.codigo}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${OFFER_STATE_COLORS[displayEstado]}`}>
                        {displayEstado}
                      </span>
                      {offer.estado === 'Validada' && offer.validador && (
                        <p className="text-[11px] text-slate-400 mt-1">Validada por {offer.validador}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDateCO(offer.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-right text-slate-900">
                      {hasQuotedValues(offer.items) ? (
                        formatCurrencyCO(offer.total)
                      ) : (
                        <span className="text-slate-400 italic font-normal">Pendiente por cotizar</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailOffer(offer)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!oferta && canValidate && (
                          <button
                            onClick={() => setValidateOffer(offer)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Validar cotización (1er Aprobador)"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                        {!oferta && canApprove && (
                          <button
                            onClick={() => {
                              setApprovalFile(null)
                              setApprovalFileError(null)
                              setConfirmOffer(offer)
                              setSelectedItemIds(Object.fromEntries(offer.items.map((i) => [i.id, true])))
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors"
                            title="Aprobar cotización definitiva (2do Aprobador)"
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {eventOffers.length < 1 && !readOnly && (
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700">
            El 1er Aprobador valida la cotización ganadora y un 2do Aprobador distinto ejecuta la aprobación definitiva; se requiere al menos una cotización para cerrar el evento.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl shrink-0 bg-amber-100 text-amber-600">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">Aprobar Cotización Definitiva</h3>
                <p className="text-sm text-slate-500 mt-1">
                  La cotización <strong>{confirmOffer.codigo}</strong> por{' '}
                  <strong>{formatCurrencyCO(confirmOffer.total)}</strong> será aprobada como definitiva por un segundo
                  Aprobador. Esta acción la marcará como ganadora, generará el presupuesto final con los ítems
                  seleccionados y no podrá cambiarse después.
                </p>
              </div>
              <button
                onClick={() => {
                  setConfirmOffer(null)
                  setApprovalFile(null)
                  setApprovalFileError(null)
                  setSelectedItemIds({})
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">
                  Ítems que conformarán el presupuesto final
                </p>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedItemIds(Object.fromEntries(confirmOffer.items.map((i) => [i.id, true])))
                    }
                    className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItemIds({})}
                    className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Ninguno
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleccione los ítems de esta cotización que pasarán al presupuesto definitivo.
              </p>
              <div className="mt-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {confirmOffer.items.map((item) => {
                  const checked = !!selectedItemIds[item.id]
                  return (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setSelectedItemIds((prev) => ({ ...prev, [item.id]: e.target.checked }))
                        }
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-slate-900 truncate">{item.descripcion}</span>
                        <span className="block text-xs text-slate-400">
                          {item.cantidad} und · {formatCurrencyCO(item.valorUnitario)} c/u
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-slate-900 shrink-0">
                        {formatCurrencyCO(item.total)}
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {Object.values(selectedItemIds).filter(Boolean).length} de {confirmOffer.items.length} ítems
                seleccionados
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium text-slate-700">
                Comunicado de aprobación <span className="text-red-500">*</span>
              </p>
              <input
                ref={approvalInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null
                  setApprovalFile(selected)
                  setApprovalFileError(selected ? getApprovalFileError(selected) : null)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => approvalInputRef.current?.click()}
                className="mt-1.5 w-full flex items-center gap-3 border border-dashed border-slate-300 rounded-md px-4 py-3 hover:border-slate-400 transition-colors text-left"
              >
                <FileUp className="w-5 h-5 text-slate-400 shrink-0" />
                <span className="flex-1 min-w-0 text-sm truncate">
                  {approvalFile ? (
                    <span className="font-mono text-slate-900">{approvalFile.name}</span>
                  ) : (
                    <span className="text-slate-400">Seleccione el comunicado oficial de aprobación</span>
                  )}
                </span>
              </button>
              <p className="text-xs text-slate-400 mt-1.5">
                Documento obligatorio (PDF, máximo {MAX_APROBACION_MB} MB) que respalda la aprobación de la cotización.
              </p>
              {approvalFileError && (
                <p className="text-xs text-red-500 mt-1.5">{approvalFileError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setConfirmOffer(null)
                  setApprovalFile(null)
                  setApprovalFileError(null)
                  setSelectedItemIds({})
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (approvalFileError || !approvalFile) return
                  const file = approvalFile ?? undefined
                  const itemIds = Object.keys(selectedItemIds).filter((k) => selectedItemIds[k])
                  onSelectOffer?.(confirmOffer.id, file, itemIds.length ? itemIds : undefined)
                  setConfirmOffer(null)
                  setApprovalFile(null)
                  setApprovalFileError(null)
                  setSelectedItemIds({})
                }}
                disabled={
                  !approvalFile ||
                  !!approvalFileError ||
                  Object.values(selectedItemIds).filter(Boolean).length === 0
                }
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Aprobar cotización definitiva
              </button>
            </div>
          </div>
        </div>
      )}
      {validateOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl shrink-0 bg-blue-100 text-blue-600">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">Validar Cotización</h3>
                <p className="text-sm text-slate-500 mt-1">
                  La cotización <strong>{validateOffer.codigo}</strong> por{' '}
                  <strong>{formatCurrencyCO(validateOffer.total)}</strong> quedará marcada como{' '}
                  <strong>Validada</strong>. Un segundo Aprobador, distinto de usted, deberá ejecutar la aprobación
                  definitiva con el comunicado de aprobación.
                </p>
              </div>
              <button
                onClick={() => setValidateOffer(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setValidateOffer(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onValidateOffer?.(validateOffer.id)
                  setValidateOffer(null)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Validar cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
