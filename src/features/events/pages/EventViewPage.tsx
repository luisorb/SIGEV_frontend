import { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ArrowLeftCircle, AlertTriangle, ClipboardList, FileSpreadsheet, FolderOpen, Package } from 'lucide-react'
import { ItemManager } from '../components/ItemManager'
import { QuotationList } from '../components/QuotationList'
import { SupportDocuments } from '../components/SupportDocuments'
import { ImportExcelModal } from '../components/ImportExcelModal'
import { useItems, type ManagedItem } from '../hooks/useItems'
import { useQuotations, QUOTATIONS_KEY } from '../../offers/hooks/useQuotations'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEventApi, updateEventApi } from '../../../services/events.service'
import { getOfertaEconomicaByEventApi, mapOfertaEconomicaToOffer } from '../../../services/offers.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useMunicipalities } from '../../../hooks/useMunicipalities'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { getStateHistory } from '../../../lib/stateHistoryStore'
import { useToast } from '../../../components/ToastProvider'
import { downloadAttachment, uploadAttachmentApi, deleteAttachmentApi } from '../../../services/attachments.service'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import type { Event, EventState, TipoSoporte, Attachment, Item, ItemInput } from '../../../types'

const ESTADO_COLORS: Record<string, string> = {
  Abierto: 'bg-yellow-100 text-yellow-800',
  'En ejecución': 'bg-blue-100 text-blue-800',
  Ejecutado: 'bg-orange-100 text-orange-800',
  Cerrado: 'bg-slate-100 text-slate-800',
  Legalizado: 'bg-purple-100 text-purple-800',
  Devuelto: 'bg-amber-100 text-amber-800',
  Rechazado: 'bg-rose-100 text-rose-800',
}

const TERMINAL_STATES: EventState[] = ['Rechazado']

const SOPORTES_LOCKED_STATES: EventState[] = ['Ejecutado', 'Cerrado', 'Legalizado']

const DETAIL_TABS = [
  { key: 'detalles', label: 'Detalles de la Orden', icon: ClipboardList },
  { key: 'cotizaciones', label: 'Listado de cotizaciones', icon: FileSpreadsheet },
  { key: 'soportes', label: 'Soportes Documentales', icon: FolderOpen },
  { key: 'items', label: 'Ítems del Evento', icon: Package },
] as const

export function EventViewPage() {
  const { id } = useParams()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { can: userCan } = useRolePermissions()
  const { allQuotations: offers, selectQuotation, changeState } = useQuotations()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventApi(id!),
    enabled: !!id,
  })

  const { data: ofertaEconomica } = useQuery({
    queryKey: ['oferta-economica', id],
    queryFn: () => getOfertaEconomicaByEventApi(id!).then((data) => (data ? mapOfertaEconomicaToOffer(data) : null)),
    enabled: !!id,
  })

  const { data: aliados = [] } = useAllies()
  const { data: desembolsos = [] } = useDisbursements()
  const { data: municipios = [] } = useMunicipalities()

  const [localOverrides] = useState<Partial<Event>>({})

  const [showHistory, setShowHistory] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'detalles' | 'cotizaciones' | 'soportes' | 'items'>('detalles')

  const {
    items,
    addItem,
    updateItem,
    removeItem,
    eventTotals,
  } = useItems(
    event?.items.map((i) => ({
      nombre: i.nombre,
      descripcion: i.descripcion,
      unidadMedida: i.unidadMedida,
      cantidad: i.cantidad,
      valorUnitario: 0,
      categoriaTributaria: i.categoriaTributaria,
      aliadoId: i.aliadoId,
      tariffId: i.tariffId,
      isTariffed: i.isTariffed,
    })),
  )

  const localEvent = useMemo<Event | null>(() => {
    if (!event) return null
    return {
      ...event,
      ...localOverrides,
      updatedAt: localOverrides.updatedAt ?? event.updatedAt,
      items: items.map((i) => ({
        id: i.id,
        eventoId: event.id,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        valorUnitario: i.valorUnitario,
        categoriaTributaria: i.categoriaTributaria,
        aliadoId: i.aliadoId,
        base: i.totals.base,
        iva: i.totals.iva,
        impuestoConsumo: i.totals.impuestoConsumo,
        feeTarifado: i.totals.feeTarifado,
        feeTerceros: i.totals.feeTerceros,
        ivaFee: i.totals.ivaFee,
        total: i.totals.total,
      })),
    }
  }, [event, localOverrides, items])

  const stateHistory = event ? getStateHistory(event.id) : []
  const displayEstado = (localEvent?.estado ?? event?.estado ?? 'Abierto') as EventState

  const selectedQuotation = offers.find((o) => o.id === event?.cotizacionSeleccionadaId)

  const ofertaTotals = (() => {
    const source = ofertaEconomica ?? selectedQuotation
    if (!source) return null
    return {
      base: source.subtotal,
      impuestos: source.ivaTotal + source.impuestoConsumoTotal,
      fee: source.feeTarifadoTotal + source.feeTercerosTotal,
      total: source.total,
    }
  })()

  const persistChainRef = useRef<Promise<void>>(Promise.resolve())

  function buildItemsPayload(nextItems: ManagedItem[]): Item[] {
    if (!event) return []
    return nextItems.map((i) => ({
      id: i.id,
      eventoId: event.id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      unidadMedida: i.unidadMedida,
      cantidad: i.cantidad,
      valorUnitario: 0,
      categoriaTributaria: i.categoriaTributaria,
      aliadoId: i.aliadoId,
      tariffId: i.tariffId,
      isTariffed: i.isTariffed,
      base: i.totals.base,
      iva: i.totals.iva,
      impuestoConsumo: i.totals.impuestoConsumo,
      feeTarifado: i.totals.feeTarifado,
      feeTerceros: i.totals.feeTerceros,
      ivaFee: i.totals.ivaFee,
      total: i.totals.total,
    }))
  }

  function persistItems(nextItems: ManagedItem[]): Promise<void> {
    if (!event) return Promise.resolve()
    const task = persistChainRef.current.then(async () => {
      await updateEventApi(event.id, {
        ...event,
        ...localOverrides,
        updatedAt: localOverrides.updatedAt ?? event.updatedAt,
        items: buildItemsPayload(nextItems),
      })
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      await queryClient.invalidateQueries({ queryKey: ['events'] })
    })
    persistChainRef.current = task.catch(() => {})
    return task
  }

  async function handleAddItem(item: ItemInput) {
    if (!event) return
    try {
      await persistItems(addItem(item))
      toast.showToast('Ítem agregado correctamente')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo agregar el ítem'), 'error')
    }
  }

  async function handleUpdateItem(id: string, updates: ItemInput) {
    if (!event) return
    try {
      await persistItems(updateItem(id, updates))
      toast.showToast('Ítem actualizado correctamente')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo actualizar el ítem'), 'error')
    }
  }

  async function handleRemoveItem(id: string) {
    if (!event) return
    try {
      await persistItems(removeItem(id))
      toast.showToast('Ítem eliminado correctamente')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo eliminar el ítem'), 'error')
    }
  }

  async function handleSelectOffer(offerId: string, file?: File) {
    if (!event) return
    try {
      if (file) {
        await uploadAttachmentApi(event.id, 'Comunicado de aprobación', file)
      }
      const quotation = await selectQuotation(offerId)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Selección de cotización ganadora',
        entidad: 'Event',
        entidadId: event.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización ${quotation.codigo} seleccionada; se generó la oferta económica definitiva`,
      })
      toast.showToast('Oferta económica definitiva generada')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo seleccionar la cotización'), 'error')
    }
  }

  async function handleRejectOffer(offerId: string, observation: string) {
    if (!event) return
    try {
      await changeState(offerId, 'Rechazada', observation)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      await queryClient.invalidateQueries({ queryKey: QUOTATIONS_KEY })
      addAuditEntry({
        accion: 'Rechazo de cotización',
        entidad: 'Quotation',
        entidadId: offerId,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización rechazada en el evento ${event.numeroEvento}: ${observation}`,
      })
      toast.showToast('Cotización rechazada')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo rechazar la cotización'), 'error')
    }
  }

  async function handleUploadSoporte(tipo: TipoSoporte, file: File) {
    if (!event) return
    try {
      await uploadAttachmentApi(event.id, tipo, file)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Carga de soporte documental',
        entidad: 'Event',
        entidadId: event.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Soporte "${tipo}" cargado: ${file.name}`,
      })
      toast.showToast(`Soporte "${tipo}" cargado correctamente`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, `No se pudo cargar el soporte "${tipo}"`), 'error')
      throw error
    }
  }

  async function handleDeleteSoporte(soporteId: string) {
    if (!event) return
    try {
      await deleteAttachmentApi(soporteId)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Eliminación de soporte documental',
        entidad: 'Event',
        entidadId: event.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Soporte eliminado del evento ${event.numeroEvento}`,
      })
      toast.showToast('Soporte eliminado')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo eliminar el soporte'), 'error')
    }
  }

  async function handleDownloadAttachment(attachment: Attachment) {
    if (!event) return
    try {
      await downloadAttachment(attachment.id, attachment.originalName)
      addAuditEntry({
        accion: 'Descarga de adjunto',
        entidad: 'Attachment',
        entidadId: attachment.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Adjunto "${attachment.originalName}" descargado del evento ${event.numeroEvento}`,
      })
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo descargar el adjunto'), 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Cargando evento...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Evento no encontrado</p>
        <Link to="/ordenes" className="inline-flex items-center gap-1.5 text-primary hover:text-primary-dark text-sm font-medium mt-3 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Volver a órdenes
        </Link>
      </div>
    )
  }

  const aliado = aliados.find((a) => a.id === event.aliadoId)
  const municipio = municipios.find((m) => m.id === event.municipioId)
  const desembolso = desembolsos.find((d) => d.id === event.desembolsoId)
  const isDevuelto = displayEstado === 'Devuelto'
  const esDevolucionLegalizacion = isDevuelto && localEvent?.devolucionLegalizacion === true

  const canEdit =
    userCan('functional_admin', 'operator', 'supervisor') ||
    (isDevuelto && userCan('analista', 'solicitante')) ||
    (displayEstado === 'Abierto' &&
      !event.cotizacionSeleccionadaId &&
      userCan('analista', 'solicitante'))

  const canModifyItems =
    userCan('functional_admin', 'operator') ||
    (isDevuelto && userCan('analista'))

  const canEditSoportes =
    userCan('functional_admin', 'operator', 'supervisor') ||
    (isDevuelto && userCan('analista')) ||
    (esDevolucionLegalizacion && userCan('solicitante'))

  const canManageOffers = userCan('functional_admin', 'operator')
  const quotationApproved = !!event.cotizacionSeleccionadaId
  const offersReadOnly =
    !canManageOffers || TERMINAL_STATES.includes(displayEstado) || quotationApproved

  const canSelectQuotation =
    userCan('approver') && !TERMINAL_STATES.includes(displayEstado) && !quotationApproved

  const soportesReadOnly =
    SOPORTES_LOCKED_STATES.includes(displayEstado) ||
    !canEditSoportes ||
    TERMINAL_STATES.includes(displayEstado)

  const itemsReadOnly =
    !canModifyItems || TERMINAL_STATES.includes(displayEstado) || quotationApproved

  const label = (text: string) => (
    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{text}</p>
  )

  const value = (text: string) => (
    <p className="text-sm font-semibold text-slate-900 mt-1">{text}</p>
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/ordenes"
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Volver a órdenes
        </Link>
      </div>

      {isDevuelto && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 flex items-start gap-3">
          <ArrowLeftCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {esDevolucionLegalizacion
                ? 'Evento devuelto para corrección de legalización'
                : 'Evento devuelto para corrección'}
            </p>
            {event.observation && (
              <p className="text-xs text-amber-700 mt-0.5">Motivo: {event.observation}</p>
            )}
            {esDevolucionLegalizacion ? (
              <p className="text-xs text-amber-600 mt-0.5">
                Solo puede corregir las carpetas de legalización (facturas normalizadas, registro fotográfico y listado de asistencia); las carpetas 1-4 quedan bloqueadas.
              </p>
            ) : (
              <p className="text-xs text-amber-600 mt-0.5">
                Pueden corregir: {canEdit ? 'su rol puede editar el evento en este estado.' : 'solo operador, analista o solicitante.'}
              </p>
            )}
          </div>
        </div>
      )}

      {displayEstado === 'Rechazado' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Evento rechazado</p>
            {event.observation && <p className="text-xs text-red-700 mt-0.5">Motivo: {event.observation}</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              activeTab === tab.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className={activeTab === 'detalles' ? '' : 'hidden'}>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              <ClipboardList className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Detalles de la Orden</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${ESTADO_COLORS[displayEstado] || 'bg-slate-100 text-slate-800'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {displayEstado}
            </span>
            {stateHistory.length > 0 && (
              <button onClick={() => setShowHistory(true)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Ver historial
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-5">
          <dl className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 rounded-xl overflow-hidden">
            <div className="bg-white px-4 py-3.5">{label('Número')}{value(event.numeroEvento)}</div>
            <div className="bg-white px-4 py-3.5">{label('Sufijo')}{value(event.sufijo || '-')}</div>
            <div className="bg-white px-4 py-3.5">{label('Fecha del evento')}{value(event.fechaEvento ? formatDateCO(event.fechaEvento) : '-')}</div>
            <div className="bg-white px-4 py-3.5">
              {label('Esquema')}
              <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-semibold text-primary bg-primary/10 rounded capitalize">{event.esquema}</span>
            </div>
            <div className="bg-white px-4 py-3.5">{label('Responsable')}{value(event.responsable || '-')}</div>
            <div className="bg-white px-4 py-3.5">{label('Dependencia')}{value(event.dependencia || '-')}</div>
            <div className="bg-white px-4 py-3.5">{label('Asistentes')}{value(String(event.asistentes))}</div>
            <div className="bg-white px-4 py-3.5">{label('Días')}{value(String(event.dias))}</div>
            <div className="bg-white px-4 py-3.5">{label('Municipio')}{value(municipio ? `${municipio.nombre} (${municipio.departamento})` : event.municipioId)}</div>
            <div className="bg-white px-4 py-3.5">{label('Vereda')}{value(event.vereda || '-')}</div>
            <div className="bg-white px-4 py-3.5">{label('Coordenadas')}{value(event.latitud && event.longitud ? `${event.latitud}, ${event.longitud}` : 'No registradas')}</div>
            <div className="bg-white px-4 py-3.5">{label('Aliado')}{value(aliado?.nombre ?? event.aliadoId)}</div>
            <div className="bg-white px-4 py-3.5">{label('Desembolso')}{value(desembolso?.nombre ?? event.desembolsoId)}</div>
            <div className="bg-white px-4 py-3.5" aria-hidden="true" />
            <div className="bg-white px-4 py-3.5" aria-hidden="true" />
          </dl>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Totales</p>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Base</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrencyCO(ofertaTotals?.base ?? eventTotals.baseTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Impuestos</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrencyCO(ofertaTotals?.impuestos ?? eventTotals.impuestosTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Fee</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrencyCO(ofertaTotals?.fee ?? eventTotals.feeTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-primary/70 uppercase tracking-wider font-semibold">Total</p>
                <p className="text-base font-bold text-primary mt-0.5">{formatCurrencyCO(ofertaTotals?.total ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {event.observaciones && (
          <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1.5">Observaciones</p>
            <p className="text-sm text-slate-700 leading-relaxed">{event.observaciones}</p>
          </div>
        )}
        </div>
      </div>

      <div className={activeTab === 'cotizaciones' ? '' : 'hidden'}>
      <QuotationList
        eventoId={event.id}
        event={event}
        offers={offers}
        selectedOfferId={event.cotizacionSeleccionadaId}
        onSelectOffer={handleSelectOffer}
        onRejectOffer={handleRejectOffer}
        oferta={ofertaEconomica ?? null}
        readOnly={offersReadOnly}
        canSelectQuotation={canSelectQuotation}
      />
      </div>

      <div className={activeTab === 'soportes' ? '' : 'hidden'}>
        <SupportDocuments
          soportes={event.soportes || []}
          attachments={event.attachments ?? []}
          readOnly={soportesReadOnly}
          eventStatus={displayEstado}
          devolucionLegalizacion={esDevolucionLegalizacion}
          onUpload={handleUploadSoporte}
          onDelete={handleDeleteSoporte}
          onDownload={handleDownloadAttachment}
        />
      </div>

      <div className={activeTab === 'items' ? '' : 'hidden'}>
      <ItemManager
        items={items}
        aliados={aliados}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        onOpenImport={!itemsReadOnly ? () => setShowImportModal(true) : undefined}
        readOnly={itemsReadOnly}
        eventAliadoId={event.aliadoId}
      />
      </div>

      <ImportExcelModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(importedItems) => {
          let nextItems: ManagedItem[] = []
          for (const item of importedItems) {
            nextItems = addItem(item)
          }
          persistItems(nextItems).catch((error) => {
            toast.showToast(getApiErrorMessage(error, 'No se pudieron guardar los ítems importados'), 'error')
          })
        }}
      />

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-[scaleIn_200ms_ease-out] flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Historial de cambios</h3>
                  <p className="text-xs text-slate-500">{stateHistory.length} registro{stateHistory.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className={`overflow-x-auto ${stateHistory.length > 10 ? 'overflow-y-auto' : ''} flex-1`}>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado Anterior</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado Nuevo</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stateHistory.map((h, i) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-400">{i + 1}</td>
                      <td className="px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{formatDateCO(h.fecha)}</td>
                      <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${ESTADO_COLORS[h.estadoAnterior] || 'bg-slate-100 text-slate-800'}`}>{h.estadoAnterior}</span></td>
                      <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${ESTADO_COLORS[h.estadoNuevo] || 'bg-slate-100 text-slate-800'}`}>{h.estadoNuevo}</span></td>
                      <td className="px-6 py-3 text-sm text-slate-600">{h.usuario}</td>
                      <td className="px-6 py-3 text-sm text-slate-500 max-w-[150px] truncate">{h.motivo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setShowHistory(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
