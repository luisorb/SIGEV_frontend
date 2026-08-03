import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Pencil, ChevronLeft, FileDown, FileText, Tag, MapPin, Layers, List } from 'lucide-react'
import { useOffers, usePermissions } from '../hooks/useOffers'
import { OFFER_STATES, OFFER_STATE_COLORS } from '../types'
import { formatCurrencyCO, formatDateTimeCO } from '../../../utils/formatters'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { exportOfferToExcel } from '../utils/excelExport'
import { exportOfferToPDF } from '../utils/pdfExport'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { OfferSummary } from '../components/OfferSummary'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import type { OfferState } from '../types'

const catColors: Record<string, string> = {
  IVA: 'bg-blue-50 text-blue-700',
  Consumo: 'bg-purple-50 text-purple-700',
  Tercero: 'bg-orange-50 text-orange-700',
  Reembolso: 'bg-teal-50 text-teal-700',
}

export function OfferViewPage() {
  const { id } = useParams()
  const toast = useToast()
  const { getOffer, changeState, isLoading } = useOffers()
  const { can } = usePermissions()

  const offer = id ? getOffer(id) : undefined

  const [pendingState, setPendingState] = useState<OfferState | null>(null)
  const [validationError, setValidationError] = useState('')
  const [scheme, setScheme] = useState<'detalle' | 'cotizacion'>('detalle')

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Cargando oferta...</p>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Oferta no encontrada</p>
        <Link
          to="/ofertas"
          className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium mt-3 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a ofertas
        </Link>
      </div>
    )
  }

  function handleStateChangeRequest(newState: OfferState) {
    if ((newState === 'Enviada' || newState === 'Aprobada') && (!offer?.aliado || !offer?.desembolso)) {
      setValidationError('La oferta debe tener Aliado y Desembolso asignados para poder ser aprobada.')
      return
    }
    setPendingState(newState)
  }

  async function confirmStateChange() {
    if (!pendingState || !id) return
    try {
      await changeState(id, pendingState)
      setPendingState(null)
      toast.showToast(`Estado cambiado a ${pendingState}`)
    } catch (error) {
      setValidationError(getApiErrorMessage(error, 'No se pudo cambiar el estado de la oferta'))
    }
  }

  function handleExportExcel() {
    if (!offer) return
    exportOfferToExcel(offer)
    addAuditEntry({
      accion: 'Exportación de oferta a Excel',
      entidad: 'Offer',
      entidadId: offer.id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Oferta ${offer.codigo} exportada a Excel`,
    })
  }

  function handleExportPDF() {
    if (!offer) return
    exportOfferToPDF(offer)
    addAuditEntry({
      accion: 'Exportación de oferta a PDF',
      entidad: 'Offer',
      entidadId: offer.id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Oferta ${offer.codigo} exportada a PDF (presupuesto definitivo)`,
    })
  }

  const label = (text: string) => (
    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">{text}</p>
  )

  const value = (text: string) => (
    <p className="text-sm font-medium text-slate-900">{text}</p>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white rounded-xl border border-slate-200 p-6">
        <div className="min-w-0">
          <Link
            to="/ofertas"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium mb-3 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Volver a ofertas
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
            {offer.nombre}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${OFFER_STATE_COLORS[offer.estado]}`}>
              {offer.estado}
            </span>
            {offer.aliado && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <Tag className="w-3.5 h-3.5" />
                {offer.aliado}
              </div>
            )}
            {offer.municipio && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                {offer.municipio}
              </div>
            )}
            <div className="text-sm text-slate-500">
              {offer.items.length} ítem{offer.items.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {can('export') && (
            <>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </>
          )}
          {can('edit') && (
            <Link
              to={`/ofertas/${offer.id}/editar`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Detalles de la Oferta</h2>
            </div>

            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-4">
              <div>
                {label('Código')}
                {value(offer.codigo)}
              </div>
              <div>
                {label('Cliente')}
                {value(offer.cliente)}
              </div>
              <div>
                {label('N° Evento')}
                {value(offer.numeroEvento || '—')}
              </div>
              <div>
                {label('Responsable')}
                {value(offer.responsable || '—')}
              </div>
              <div>
                {label('Dependencia')}
                {value(offer.dependencia || '—')}
              </div>
              <div>
                {label('Municipio')}
                {value(offer.municipio || '—')}
              </div>
              <div>
                {label('Aliado')}
                {value(offer.aliado || '—')}
              </div>
              <div>
                {label('Desembolso')}
                {value(offer.desembolso || '—')}
              </div>
              <div>
                {label('Esquema')}
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded capitalize">
                  {offer.esquema === 'cotizacion' ? 'Cotización' : offer.esquema === 'detalle' ? 'Detalle' : '—'}
                </span>
              </div>
              <div>
                {label('Creada')}
                {value(formatDateTimeCO(offer.createdAt))}
              </div>
              <div>
                {label('Actualizada')}
                {value(formatDateTimeCO(offer.updatedAt))}
              </div>
              <div>
                {label('Ítems')}
                {value(String(offer.items.length))}
              </div>
            </div>

            {offer.descripcion && (
              <div className="border-t border-slate-100 px-5 py-3">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">Descripción</p>
                <p className="text-sm text-slate-700 leading-relaxed">{offer.descripcion}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setScheme('detalle')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  scheme === 'detalle'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Detalle
              </button>
              <button
                onClick={() => setScheme('cotizacion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  scheme === 'cotizacion'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Cotización
              </button>
            </div>
            {scheme === 'cotizacion' && (
              <span className="text-xs text-slate-400">Vista resumida · solo totales</span>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {scheme === 'detalle' ? (
              <>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ítems de la Oferta</h2>
                </div>
                {offer.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Cant.</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Vr. Unitario</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Cat.</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Base</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">IVA</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Imp. Consumo</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Fee</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">IVA Fee</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {offer.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-2 text-slate-900">{item.descripcion}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{item.cantidad}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.valorUnitario)}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${catColors[item.categoriaTributaria] || 'bg-slate-100 text-slate-600'}`}>
                                {item.categoriaTributaria}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.base)}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.iva)}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.impuestoConsumo)}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.feeTarifado + item.feeTerceros)}</td>
                            <td className="px-4 py-2 text-right text-slate-600">{formatCurrencyCO(item.ivaFee)}</td>
                            <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatCurrencyCO(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                        <tr>
                          <td colSpan={4} className="px-4 py-2.5 text-sm font-semibold text-slate-900">Totales</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.subtotal)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.ivaTotal)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.impuestoConsumoTotal)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal)}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(offer.ivaFeeTotal)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-primary">{formatCurrencyCO(offer.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic px-6 py-4">Sin ítems</p>
                )}
              </>
            ) : (
              <OfferSummary offer={offer} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Estado de la Oferta</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${OFFER_STATE_COLORS[offer.estado]}`}>
                {offer.estado}
              </span>
            </div>
            {can('changeState') && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cambiar estado</label>
                <div className="flex flex-wrap gap-2">
                  {OFFER_STATES.filter((s) => s !== offer.estado).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStateChangeRequest(s)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        s === 'Aprobada'
                          ? 'border-green-300 text-green-700 hover:bg-green-50'
                          : s === 'Rechazada'
                            ? 'border-red-300 text-red-700 hover:bg-red-50'
                            : s === 'Enviada'
                              ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {scheme === 'detalle' && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Resumen Rápido</h3>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base</span>
                  <span className="font-medium text-slate-900">{formatCurrencyCO(offer.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">IVA</span>
                  <span className="font-medium text-slate-900">{formatCurrencyCO(offer.ivaTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Imp. Consumo</span>
                  <span className="font-medium text-slate-900">{formatCurrencyCO(offer.impuestoConsumoTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fee</span>
                  <span className="font-medium text-slate-900">{formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">IVA Fee</span>
                  <span className="font-medium text-slate-900">{formatCurrencyCO(offer.ivaFeeTotal)}</span>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-primary">{formatCurrencyCO(offer.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {validationError && (
        <ConfirmDialog
          isOpen
          title="Validación"
          message={validationError}
          confirmLabel="Entendido"
          variant="warning"
          onConfirm={() => setValidationError('')}
          onCancel={() => setValidationError('')}
        />
      )}

      {pendingState && !validationError && (
        <ConfirmDialog
          isOpen
          title="Cambiar estado"
          message={`¿Estás seguro de cambiar la oferta ${offer.codigo} de ${offer.estado} a ${pendingState}?`}
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
