import { useEffect, useState } from 'react'
import { X, Receipt, FileText, Download, CheckCircle2 } from 'lucide-react'
import type { Offer } from '../../offers/types'
import { OFFER_STATE_COLORS } from '../../offers/types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { hasQuotedValues } from '../../offers/utils/offerValues'
import type { Event, Attachment } from '../../../types'
import { getEventAttachmentsApi, downloadAttachment } from '../../../services/attachments.service'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'

const catColors: Record<string, string> = {
  IVA: 'bg-blue-50 text-blue-700',
  Consumo: 'bg-purple-50 text-purple-700',
  Tercero: 'bg-orange-50 text-orange-700',
  Reembolso: 'bg-teal-50 text-teal-700',
}

interface QuotationDetailModalProps {
  offer: Offer
  event: Event
  onClose: () => void
}

export function QuotationDetailModal({ offer, event, onClose }: QuotationDetailModalProps) {
  const hasValues = hasQuotedValues(offer.items)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  useEffect(() => {
    let active = true
    getEventAttachmentsApi(event.id)
      .then((list) => {
        if (active) {
          setAttachments(
            list.filter(
              (a) =>
                a.category === 'Cotizaciones presentadas' &&
                (a.quotationId ? a.quotationId === offer.id : false),
            ),
          )
        }
      })
      .catch(() => {
        if (active) setAttachments([])
      })
    return () => {
      active = false
    }
  }, [event.id, offer.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[92vh] overflow-y-auto animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="flex items-start justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-primary/10 rounded-md">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900">Detalle de cotización</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Valoración económica de la orden {event.numeroEvento}
                  {event.sufijo ? `-${event.sufijo}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y divide-slate-200 border-t border-slate-200 sm:divide-y-0 sm:divide-x">
            <div className="px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">N.º cotización</p>
              <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">{offer.codigo}</p>
            </div>
            <div className="px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Fecha de registro</p>
              <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">{formatDateCO(offer.createdAt)}</p>
            </div>
            <div className="px-6 py-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Estado</p>
              <span className={`mt-0.5 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${OFFER_STATE_COLORS[offer.estado]}`}>
                {offer.estado}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-7">
          {offer.estado === 'Rechazada' && offer.observations && (
            <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <header className="flex items-center gap-2 mb-1.5">
                <span className="w-1 h-3.5 bg-red-500 rounded-sm" aria-hidden="true" />
                <h4 className="text-[11px] font-mono uppercase tracking-widest text-red-700">
                  Motivo de rechazo
                </h4>
              </header>
              <p className="text-sm text-red-900 leading-relaxed">{offer.observations}</p>
            </section>
          )}

          <section>
            <header className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold shrink-0"
                  aria-hidden="true"
                >
                  1
                </span>
                <h4 className="text-sm font-semibold text-slate-800">Ítems valorados</h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                {offer.items.length} ítems
              </span>
            </header>

            {offer.items.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-md px-6 py-10 text-center">
                <p className="text-sm text-slate-400">Esta cotización no tiene ítems valorados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-10">N.º</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500">Servicio</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-20">Cant.</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-40">Vr. unitario</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-mono uppercase tracking-widest text-slate-500 w-28">Carga tributaria</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-40">Vr. total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {offer.items.map((item, idx) => {
                      const isTariffed = Boolean(item.tariffId)
                      return (
                        <tr key={item.id} className="align-top hover:bg-slate-50/60">
                          <td className="px-3 py-3.5 font-mono text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                          <td className="px-3 py-3.5">
                            <p className="font-medium text-slate-900">{item.descripcion}</p>
                            <span
                              className={`mt-1.5 inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium ${
                                isTariffed ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isTariffed ? 'Tarifado' : 'No tarifado'}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{item.cantidad}</td>
                          <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">
                            {hasValues ? formatCurrencyCO(item.valorUnitario) : '—'}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${catColors[item.categoriaTributaria] || 'bg-slate-100 text-slate-600'}`}>
                              {item.categoriaTributaria}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                            {hasValues ? formatCurrencyCO(item.base) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-2">
              El valor unitario de los servicios tarifados se calculó según la categoría DIVIPOLA del municipio.
            </p>
          </section>

          <section>
            <header className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold shrink-0"
                aria-hidden="true"
              >
                2
              </span>
              <h4 className="text-sm font-semibold text-slate-800">Resumen de la cotización</h4>
            </header>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="divide-x divide-slate-200">
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Base</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {hasValues ? formatCurrencyCO(offer.subtotal) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">IVA</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {hasValues ? formatCurrencyCO(offer.ivaTotal) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Imp. consumo</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {hasValues ? formatCurrencyCO(offer.impuestoConsumoTotal) : '—'}
                      </p>
                    </td>
                  </tr>
                  <tr className="divide-x divide-slate-200 border-t border-slate-200">
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">FEE</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {hasValues ? formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">IVA FEE</p>
                      <p className="mt-0.5 font-mono text-sm text-slate-900 tabular-nums">
                        {hasValues ? formatCurrencyCO(offer.ivaFeeTotal) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 bg-primary/5">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-primary">Total</p>
                      <p className="mt-0.5 font-mono text-lg font-bold text-primary tabular-nums">
                        {hasValues ? formatCurrencyCO(offer.total) : '—'}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {!hasValues && (
              <p className="text-[11px] text-amber-600 mt-2">
                Esta cotización no tiene valores asignados: los ítems están pendientes por valorar.
              </p>
            )}
          </section>

          <section>
            <header className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[11px] font-semibold shrink-0"
                  aria-hidden="true"
                >
                  3
                </span>
                <h4 className="text-sm font-semibold text-slate-800">Documento soporte del proveedor</h4>
              </div>
              {attachments.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {attachments.length} adjunto{attachments.length !== 1 ? 's' : ''}
                </span>
              )}
            </header>
            {attachments.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-md px-6 py-8 text-center">
                <p className="text-sm text-slate-400">Esta cotización no tiene documento soporte adjunto.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-md overflow-hidden">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                    <div className="p-2 bg-slate-100 rounded-md shrink-0">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{att.originalName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(att.fileSize / 1024).toFixed(1)} KB · {formatDateCO(att.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        downloadAttachment(att.id, att.originalName)
                        addAuditEntry({
                          accion: 'Descarga de adjunto',
                          entidad: 'Attachment',
                          entidadId: att.id,
                          usuario: getCurrentUser(),
                          fecha: new Date().toISOString(),
                          detalle: `Adjunto "${att.originalName}" descargado de la cotización ${offer.codigo}`,
                        })
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98] transition-all duration-150"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
