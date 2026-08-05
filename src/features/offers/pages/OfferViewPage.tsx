import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, FileDown, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useOffers, usePermissions } from '../hooks/useOffers'
import { formatCurrencyCO, formatDateTimeCO, formatDateCO } from '../../../utils/formatters'
import { exportOfferToExcel } from '../utils/excelExport'
import { exportOfferToPDF } from '../utils/pdfExport'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { getEventApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useMunicipalities } from '../../../hooks/useMunicipalities'

const catColors: Record<string, string> = {
  IVA: 'bg-blue-50 text-blue-700',
  Consumo: 'bg-purple-50 text-purple-700',
  Tercero: 'bg-orange-50 text-orange-700',
  Reembolso: 'bg-teal-50 text-teal-700',
}

const eventStateColors: Record<string, string> = {
  Abierto: 'bg-yellow-100 text-yellow-800',
  'En ejecución': 'bg-blue-100 text-blue-800',
  Ejecutado: 'bg-orange-100 text-orange-800',
  Cerrado: 'bg-slate-100 text-slate-800',
  Legalizado: 'bg-purple-100 text-purple-800',
  Devuelto: 'bg-amber-100 text-amber-800',
  Rechazado: 'bg-rose-100 text-rose-800',
}

export function OfferViewPage() {
  const { id } = useParams()
  const { getOffer, isLoading } = useOffers()
  const { can } = usePermissions()

  const offer = id ? getOffer(id) : undefined

  const { data: event } = useQuery({
    queryKey: ['event', offer?.eventoId],
    queryFn: () => getEventApi(offer!.eventoId!),
    enabled: !!offer?.eventoId,
  })

  const { data: aliados = [] } = useAllies()
  const { data: municipios = [] } = useMunicipalities()

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

  function handleExportExcel() {
    if (!offer) return
    exportOfferToExcel(offer, aliados)
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
    exportOfferToPDF(offer, aliados)
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

  const eventMunicipio = event ? municipios.find((m) => m.id === event.municipioId) : undefined
  const eventMunicipioLabel = eventMunicipio
    ? `${eventMunicipio.nombre} (${eventMunicipio.departamento})`
    : event?.municipioId ?? offer.municipio ?? '—'

  function aliadoName(aliadoId?: string): string | undefined {
    if (!aliadoId) return undefined
    const a = aliados.find((x) => x.id === aliadoId)
    return a?.nombre ?? aliadoId
  }

  const displayItems = event?.items?.length ? event.items : offer.items

  const orderTotals = displayItems.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.base,
      iva: acc.iva + item.iva,
      impuestoConsumo: acc.impuestoConsumo + item.impuestoConsumo,
      fee: acc.fee + item.feeTarifado + item.feeTerceros,
      ivaFee: acc.ivaFee + item.ivaFee,
      total: acc.total + item.total,
    }),
    { subtotal: 0, iva: 0, impuestoConsumo: 0, fee: 0, ivaFee: 0, total: 0 },
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/ofertas"
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Volver a ofertas
        </Link>
        {can('export') && (
          <div className="flex items-center gap-2 shrink-0">
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
          </div>
        )}
      </div>

      <div className="space-y-6">
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
                {label('Nombre de la oferta')}
                {value(offer.nombre)}
              </div>
              <div>
                {label('Desembolso')}
                {value(offer.desembolso || '—')}
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

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Información de la Orden</h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 gap-y-4">
              <div>
                {label('Número')}
                {value((event?.numeroEvento ?? offer.numeroEvento) || '—')}
              </div>
              <div>
                {label('Sufijo')}
                {value(event?.sufijo || '—')}
              </div>
              <div>
                {label('Responsable')}
                {value((event?.responsable ?? offer.responsable) || '—')}
              </div>
              <div>
                {label('Dependencia')}
                {value((event?.dependencia ?? offer.dependencia) || '—')}
              </div>
              <div>
                {label('Fecha del evento')}
                {value(event?.fechaEvento ? formatDateCO(event.fechaEvento) : '—')}
              </div>
              <div>
                {label('Municipio')}
                {value(eventMunicipioLabel)}
              </div>
              <div>
                {label('Vereda')}
                {value(event?.vereda || '—')}
              </div>
              <div>
                {label('Esquema')}
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded capitalize">
                  {event?.esquema ?? offer.esquema ?? '—'}
                </span>
              </div>
              <div>
                {label('Asistentes')}
                {value(event ? String(event.asistentes) : '—')}
              </div>
              <div>
                {label('Días')}
                {value(event ? String(event.dias) : '—')}
              </div>
              <div>
                {label('Estado')}
                {event ? (
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${eventStateColors[event.estado] || 'bg-slate-100 text-slate-700'}`}>
                    {event.estado}
                  </span>
                ) : value('—')}
              </div>
              <div>
                {label('Aliado general')}
                {value((aliadoName(event?.aliadoId) ?? offer.aliado) || '—')}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Items de la Orden</h2>
            </div>
            {displayItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Aliado</th>
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
                    {displayItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-slate-900">{item.descripcion}</td>
                        <td className="px-4 py-2 text-slate-600">
                          {item.aliadoId ? (
                            aliadoName(item.aliadoId)
                          ) : (
                            <span className="text-slate-400">{(aliadoName(event?.aliadoId) ?? offer.aliado) || 'General'}</span>
                          )}
                        </td>
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
                      <td colSpan={5} className="px-4 py-2.5 text-sm font-semibold text-slate-900">Totales</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(orderTotals.subtotal)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(orderTotals.iva)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(orderTotals.impuestoConsumo)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(orderTotals.fee)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCurrencyCO(orderTotals.ivaFee)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">{formatCurrencyCO(orderTotals.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic px-6 py-4">Sin ítems</p>
            )}
          </div>
        </div>
      </div>
  )
}
