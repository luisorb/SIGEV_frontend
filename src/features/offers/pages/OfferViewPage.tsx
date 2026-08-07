import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, FileDown, Download, FileText, ClipboardList, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useOffers, usePermissions } from '../hooks/useOffers'
import { formatCurrencyCO, formatDateTimeCO, formatDateCO } from '../../../utils/formatters'
import { exportOfferToExcel } from '../utils/excelExport'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { getEventApi } from '../../../services/events.service'
import { downloadAttachment } from '../../../services/attachments.service'
import { useAllies } from '../../../hooks/useAllies'
import { useMunicipalities } from '../../../hooks/useMunicipalities'
import { useActiveCalculationParams } from '../../../hooks/useActiveCalculationParams'
import { hasQuotedValues } from '../utils/offerValues'
import { OFFER_STATE_COLORS } from '../types'

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
  const rates = useActiveCalculationParams()

  const [activeTab, setActiveTab] = useState<'detalles' | 'orden' | 'items'>('detalles')

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
    exportOfferToExcel(offer, {
      event,
      aliados,
      municipios,
      rates,
      usuario: getCurrentUser(),
      fechaCorte: new Date(),
      filtros: 'Ninguno',
    })
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
    const presupuesto = event?.attachments?.find((a) => a.category === 'Presupuesto final')
    if (!presupuesto) {
      window.alert('El presupuesto final aún no está disponible. Seleccione la cotización ganadora para generarlo.')
      return
    }
    void downloadAttachment(presupuesto.id, presupuesto.originalName)
    addAuditEntry({
      accion: 'Descarga del presupuesto final',
      entidad: 'Offer',
      entidadId: offer.id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Presupuesto final de la oferta ${offer.codigo} descargado`,
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

  const displayItems = offer.items.length ? offer.items : event?.items ?? []

  const hasValues = hasQuotedValues(offer.items)

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
            {offer.estado === 'Definitiva' && (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Presupuesto final
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab('detalles')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeTab === 'detalles' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          Detalles de la Oferta
        </button>
        <button
          onClick={() => setActiveTab('orden')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeTab === 'orden' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Información de la Orden
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            activeTab === 'items' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
          }`}
        >
          <Package className="w-4 h-4" />
          Items de la Orden
        </button>
      </div>

      <div className={activeTab === 'detalles' ? '' : 'hidden'}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-4 h-4 text-primary" />
              </span>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Detalles de la Oferta</h2>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${OFFER_STATE_COLORS[offer.estado]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {offer.estado}
            </span>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Código')}
              {value(offer.codigo)}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Cliente')}
              {value(offer.cliente)}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Nombre de la oferta')}
              {value(offer.nombre)}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Desembolso')}
              {value(offer.desembolso || '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Creada')}
              {value(formatDateTimeCO(offer.createdAt))}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Actualizada')}
              {value(formatDateTimeCO(offer.updatedAt))}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Ítems')}
              {value(String(offer.items.length))}
            </div>
          </div>

          {offer.descripcion && (
            <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-4">
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Descripción</p>
              <p className="text-sm text-slate-700 leading-relaxed">{offer.descripcion}</p>
            </div>
          )}
        </div>
      </div>

      <div className={activeTab === 'orden' ? '' : 'hidden'}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-primary/10 rounded-lg">
                <ClipboardList className="w-4 h-4 text-primary" />
              </span>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Información de la Orden</h2>
            </div>
            {event && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${eventStateColors[event.estado] || 'bg-slate-100 text-slate-800'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                {event.estado}
              </span>
            )}
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Número')}
              {value((event?.numeroEvento ?? offer.numeroEvento) || '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Sufijo')}
              {value(event?.sufijo || '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Responsable')}
              {value((event?.responsable ?? offer.responsable) || '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Dependencia')}
              {value((event?.dependencia ?? offer.dependencia) || '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Fecha del evento')}
              {value(event?.fechaEvento ? formatDateCO(event.fechaEvento) : '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Municipio')}
              {value(eventMunicipioLabel)}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Vereda')}
              {value(event?.vereda || '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Esquema')}
              <span className="inline-flex items-center px-2.5 py-0.5 mt-1 text-xs font-semibold text-primary bg-primary/10 rounded-md capitalize">
                {event?.esquema ?? offer.esquema ?? '—'}
              </span>
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Asistentes')}
              {value(event ? String(event.asistentes) : '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Días')}
              {value(event ? String(event.dias) : '—')}
            </div>
            <div className="border border-slate-100 rounded-lg px-4 py-3">
              {label('Aliado general')}
              {value((aliadoName(event?.aliadoId) ?? offer.aliado) || '—')}
            </div>
          </div>
        </div>
      </div>

      <div className={activeTab === 'items' ? '' : 'hidden'}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-4 h-4 text-primary" />
              </span>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Items de la Orden</h2>
            </div>
            <span className="text-xs font-medium text-slate-400">{displayItems.length} ítems</span>
          </div>

          {displayItems.length > 0 ? (
            <>
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
                        <td className="px-4 py-2 text-right text-slate-600">
                          {hasValues ? (
                            formatCurrencyCO(item.valorUnitario)
                          ) : (
                            <span className="italic text-slate-400">Pendiente por cotizar</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${catColors[item.categoriaTributaria] || 'bg-slate-100 text-slate-600'}`}>
                            {item.categoriaTributaria}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-slate-600">{hasValues ? formatCurrencyCO(item.base) : '—'}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{hasValues ? formatCurrencyCO(item.iva) : '—'}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{hasValues ? formatCurrencyCO(item.impuestoConsumo) : '—'}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{hasValues ? formatCurrencyCO(item.feeTarifado + item.feeTerceros) : '—'}</td>
                        <td className="px-4 py-2 text-right text-slate-600">{hasValues ? formatCurrencyCO(item.ivaFee) : '—'}</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-900">{hasValues ? formatCurrencyCO(item.total) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/30">
                <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Subtotal</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{hasValues ? formatCurrencyCO(orderTotals.subtotal) : '—'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">IVA</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{hasValues ? formatCurrencyCO(orderTotals.iva) : '—'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Imp. Consumo</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{hasValues ? formatCurrencyCO(orderTotals.impuestoConsumo) : '—'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Fee</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{hasValues ? formatCurrencyCO(orderTotals.fee) : '—'}</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-center">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">IVA Fee</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{hasValues ? formatCurrencyCO(orderTotals.ivaFee) : '—'}</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2.5 text-center">
                    <p className="text-[11px] text-primary/70 uppercase tracking-wider font-semibold">Total</p>
                    <p className="text-base font-bold text-primary mt-0.5">{hasValues ? formatCurrencyCO(orderTotals.total) : '—'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 italic px-6 py-4">Sin ítems</p>
          )}
        </div>
      </div>
    </div>
  )
}
