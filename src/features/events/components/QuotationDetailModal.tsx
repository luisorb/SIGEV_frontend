import { useEffect, useState } from 'react'
import { X, Receipt, FileText, Download } from 'lucide-react'
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
            <header className="flex items-center gap-2 mb-3">
              <span className="w-1 h-3.5 bg-primary rounded-sm" aria-hidden="true" />
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                Ítems valorados
              </h4>
            </header>

            {offer.items.length === 0 ? (
              <div className="border border-dashed border-slate-300 rounded-md px-6 py-10 text-center">
                <p className="text-sm text-slate-400">Esta cotización no tiene ítems valorados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500 w-10">N.º</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-slate-500">Descripción</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-16">Cant.</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-28">Vr. unitario</th>
                      <th className="px-3 py-2.5 text-center text-[10px] font-mono uppercase tracking-widest text-slate-500 w-20">Cat.</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-28">Base</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-24">IVA</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-24">Imp. consumo</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-24">Fee</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-24">IVA fee</th>
                      <th className="px-3 py-2.5 text-right text-[10px] font-mono uppercase tracking-widest text-slate-500 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {offer.items.map((item, idx) => (
                      <tr key={item.id} className="align-top hover:bg-slate-50/60">
                        <td className="px-3 py-3.5 font-mono text-xs text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="px-3 py-3.5">
                          <p className="font-medium text-slate-900">{item.descripcion}</p>
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
                        <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{hasValues ? formatCurrencyCO(item.base) : '—'}</td>
                        <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{hasValues ? formatCurrencyCO(item.iva) : '—'}</td>
                        <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{hasValues ? formatCurrencyCO(item.impuestoConsumo) : '—'}</td>
                        <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{hasValues ? formatCurrencyCO(item.feeTarifado + item.feeTerceros) : '—'}</td>
                        <td className="px-3 py-3.5 text-right font-mono text-slate-700 tabular-nums">{hasValues ? formatCurrencyCO(item.ivaFee) : '—'}</td>
                        <td className="px-3 py-3.5 text-right font-semibold font-mono text-slate-900 tabular-nums">{hasValues ? formatCurrencyCO(item.total) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300">
                      <td colSpan={5} className="px-3 py-3 text-sm font-semibold text-slate-900">Totales</td>
                      {hasValues ? (
                        <>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatCurrencyCO(offer.subtotal)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatCurrencyCO(offer.ivaTotal)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatCurrencyCO(offer.impuestoConsumoTotal)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">{formatCurrencyCO(offer.ivaFeeTotal)}</td>
                          <td className="px-3 py-3 text-right font-bold text-primary tabular-nums">{formatCurrencyCO(offer.total)}</td>
                        </>
                      ) : (
                        <td colSpan={6} className="px-3 py-3 text-right text-slate-400">—</td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          <section>
            <header className="flex items-center gap-2 mb-3">
              <span className="w-1 h-3.5 bg-primary rounded-sm" aria-hidden="true" />
              <h4 className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                Documento soporte del proveedor
              </h4>
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
