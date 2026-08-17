import { useState, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ArrowLeftCircle, AlertTriangle, CalendarClock, ClipboardList, FileSpreadsheet, FolderOpen, MapPin, Package, Wallet, ExternalLink } from 'lucide-react'
import { ItemManager } from '../components/ItemManager'
import { QuotationList } from '../components/QuotationList'
import { SupportDocuments } from '../components/SupportDocuments'
import { PaymentsSection } from '../components/PaymentsSection'
import { MapViewer } from '../components/MapViewer'
import { useItems, type ManagedItem } from '../hooks/useItems'
import { useQuotations } from '../../offers/hooks/useQuotations'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getEventApi, updateEventApi, updateEventItemsApi } from '../../../services/events.service'
import { getOfertaEconomicaByEventApi, mapOfertaEconomicaToOffer } from '../../../services/offers.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useMunicipalities } from '../../../hooks/useMunicipalities'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { getStateHistory } from '../../../lib/stateHistoryStore'
import { getAuditByEntityApi } from '../../../services/audit.service'
import { useToast } from '../../../components/ToastProvider'
import { downloadAttachment, uploadAttachmentApi, deleteAttachmentApi } from '../../../services/attachments.service'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { SOPORTES_MODIFICABLES } from '../../../types'
import type { Event, EventState, TipoSoporte, Attachment, Item, ItemInput } from '../../../types'

const ESTADO_COLORS: Record<string, string> = {
  Abierto: 'bg-yellow-100 text-yellow-800',
  'En ejecución': 'bg-blue-100 text-blue-800',
  Ejecutado: 'bg-orange-100 text-orange-800',
  Cerrado: 'bg-slate-100 text-slate-800',
  Legalizado: 'bg-purple-100 text-purple-800',
  Devuelto: 'bg-amber-100 text-amber-800',
  Cancelado: 'bg-rose-100 text-rose-800',
}

const TERMINAL_STATES: EventState[] = ['Cancelado']

const DATE_NOTICE_STATES: EventState[] = ['Abierto', 'En ejecución', 'Ejecutado', 'Cerrado', 'Devuelto']

const SOPORTES_LOCKED_STATES: EventState[] = ['Ejecutado', 'Cerrado', 'Legalizado']

const DETAIL_TABS = [
  { key: 'detalles', label: 'Detalles de la Orden', icon: ClipboardList },
  { key: 'items', label: 'Ítems del Evento', icon: Package },
  { key: 'cotizaciones', label: 'Listado de cotizaciones', icon: FileSpreadsheet },
  { key: 'soportes', label: 'Soportes Documentales', icon: FolderOpen },
  { key: 'pagos', label: 'Pagos', icon: Wallet },
] as const

type DetailTab = (typeof DETAIL_TABS)[number]['key']

export function EventViewPage() {
  const { id } = useParams()
  const toast = useToast()
  const queryClient = useQueryClient()
  const { can: userCan } = useRolePermissions()
  const { allQuotations: offers, selectQuotation, validateQuotation } = useQuotations()

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

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-event', id],
    queryFn: () => getAuditByEntityApi('Event', id!),
    enabled: !!id,
    retry: false,
  })

  const { data: aliados = [] } = useAllies({ all: true })
  const { data: desembolsos = [] } = useDisbursements({ all: true })
  const { data: municipios = [] } = useMunicipalities()

  const [localOverrides] = useState<Partial<Event>>({})

  const [showHistory, setShowHistory] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [activeTab, setActiveTab] = useState<DetailTab>('detalles')

  const {
    items,
    addItem,
    updateItem,
    removeItem,
    eventTotals,
  } = useItems(
    event?.items.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      unidadMedida: i.unidadMedida,
      cantidad: i.cantidad,
      valorUnitario: i.valorUnitario,
      categoriaTributaria: i.categoriaTributaria,
      aliadoId: i.aliadoId,
      tariffId: i.tariffId,
      isTariffed: i.isTariffed,
      createdAt: i.createdAt,
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

  const stateHistory = useMemo(() => {
    if (!event) return []
    const statusChanges = auditLogs
      .filter((entry) => entry.detalle?.includes('/status'))
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    if (statusChanges.length > 0) {
      const parseStatus = (raw?: string): EventState | null => {
        if (!raw) return null
        try {
          const parsed = JSON.parse(raw) as Record<string, unknown>
          return typeof parsed?.status === 'string' ? (parsed.status as EventState) : null
        } catch {
          return null
        }
      }
      return statusChanges
        .map((entry, index) => {
          const estadoNuevo = parseStatus(entry.valorNuevo) ?? 'Abierto'
          const prev = index > 0 ? statusChanges[index - 1] : null
          const estadoAnterior = prev ? parseStatus(prev.valorNuevo) ?? 'Abierto' : 'Abierto'
          let motivo = ''
          if (entry.valorNuevo) {
            try {
              const parsed = JSON.parse(entry.valorNuevo) as Record<string, unknown>
              if (typeof parsed?.observation === 'string') motivo = parsed.observation
            } catch {
              // JSON no parseable; se ignora el motivo
            }
          }
          return {
            id: `aud-${entry.id}`,
            eventoId: event.id,
            estadoAnterior,
            estadoNuevo,
            usuario: entry.usuario,
            fecha: entry.fecha,
            motivo,
          }
        })
        .reverse()
    }

    return getStateHistory(event.id)
  }, [auditLogs, event])

  const displayEstado = (localEvent?.estado ?? event?.estado ?? 'Abierto') as EventState

  const dateStatus = useMemo(() => {
    const raw = event?.fechaEvento
    if (!raw) return null
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
    if (!match) return null
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const eventTime = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime()
    if (eventTime === todayStart) return null
    const formatted = formatDateCO(raw)
    if (eventTime < todayStart) {
      return { overdue: true, text: `La fecha de ejecución programada (${formatted}) ya pasó.` }
    }
    return { overdue: false, text: `La fecha de ejecución programada (${formatted}) aún no llega.` }
  }, [event?.fechaEvento])

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
      valorUnitario: i.valorUnitario,
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
      const payload = buildItemsPayload(nextItems)
      if (userCan('solicitante')) {
        await updateEventItemsApi(event.id, payload)
      } else {
        await updateEventApi(event.id, {
          ...event,
          ...localOverrides,
          updatedAt: localOverrides.updatedAt ?? event.updatedAt,
          items: payload,
        })
      }
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

  async function handleValidateOffer(offerId: string) {
    if (!event) return
    try {
      await validateQuotation(offerId)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Validación de cotización ganadora',
        entidad: 'Quotation',
        entidadId: offerId,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización validada en el evento ${event.numeroEvento}; pendiente de aprobación definitiva por un segundo Aprobador`,
      })
      toast.showToast('Cotización validada; un segundo Aprobador debe ejecutar la aprobación definitiva')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo validar la cotización'), 'error')
    }
  }

  async function handleSelectOffer(offerId: string, file?: File, itemIds?: string[]) {
    if (!event) return
    try {
      if (file) {
        await uploadAttachmentApi(event.id, 'Comunicado de aprobación', file)
      }
      const quotation = await selectQuotation(offerId, itemIds)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Selección de cotización ganadora',
        entidad: 'Event',
        entidadId: event.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización ${quotation.codigo} seleccionada; se generó la oferta económica definitiva${itemIds?.length ? ' con composición por ítem' : ''}`,
      })
      toast.showToast('Oferta económica definitiva generada')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo seleccionar la cotización'), 'error')
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
    userCan('functional_admin', 'supervisor') ||
    (isDevuelto && userCan('analista', 'solicitante')) ||
    (displayEstado === 'Abierto' &&
      !event.cotizacionSeleccionadaId &&
      userCan('analista', 'solicitante'))

  const canModifyItems =
    userCan('functional_admin') ||
    (isDevuelto && userCan('analista')) ||
    (userCan('solicitante') &&
      (isDevuelto || displayEstado === 'Abierto' || displayEstado === 'En ejecución'))

  const devueltoPermiteSoportes =
    isDevuelto &&
    (esDevolucionLegalizacion ||
      localEvent?.devueltoDesde === 'En ejecución' ||
      localEvent?.devueltoDesde === 'Ejecutado' ||
      localEvent?.devueltoDesde === 'Cerrado')

  const canEditSoportes =
    userCan('functional_admin', 'operator', 'supervisor') ||
    (isDevuelto && userCan('analista')) ||
    ((devueltoPermiteSoportes || displayEstado === 'En ejecución') &&
      userCan('solicitante'))

  const canEditFolder = (tipo: TipoSoporte): boolean => {
    if (!canEditSoportes) return false
    if (userCan('solicitante') && !SOPORTES_MODIFICABLES.includes(tipo)) return false
    return true
  }

  const canManageOffers = userCan('functional_admin', 'operator')
  const quotationApproved = !!event.cotizacionSeleccionadaId
  const lockReasons = new Map<string, string>()
  for (const item of event.items) {
    if (item.pagado) {
      lockReasons.set(item.id, 'Este ítem ya fue pagado y no se puede editar ni eliminar.')
    }
  }
  if (event.cotizacionSeleccionadaId) {
    const approvedQuotation = event.quotations?.find((q) => q.id === event.cotizacionSeleccionadaId)
    for (const qi of approvedQuotation?.items ?? []) {
      if (qi.itemId) {
        lockReasons.set(qi.itemId, 'Este ítem está incluido en la cotización aprobada y no se puede editar ni eliminar.')
      }
    }
  }
  const offersReadOnly =
    !canManageOffers || TERMINAL_STATES.includes(displayEstado) || quotationApproved

  const canSelectQuotation =
    userCan('approver') && !TERMINAL_STATES.includes(displayEstado) && !quotationApproved

  const soportesReadOnly =
    SOPORTES_LOCKED_STATES.includes(displayEstado) ||
    !canEditSoportes ||
    TERMINAL_STATES.includes(displayEstado)

  const itemsReadOnly =
    !canModifyItems ||
    TERMINAL_STATES.includes(displayEstado) ||
    (quotationApproved && !userCan('solicitante'))

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
                Pueden corregir el encabezado: {canEdit ? 'su rol puede editar la orden en este estado.' : 'solo analista o solicitante.'} El Operador gestiona ítems y cotizaciones.
              </p>
            )}
          </div>
        </div>
      )}

      {displayEstado === 'Cancelado' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Evento cancelado</p>
            {event.observation && <p className="text-xs text-red-700 mt-0.5">Motivo: {event.observation}</p>}
          </div>
        </div>
      )}

      {dateStatus?.overdue && DATE_NOTICE_STATES.includes(displayEstado) && (
        <div className="rounded-xl px-6 py-4 flex items-start gap-3 bg-amber-50 border border-amber-200">
          <CalendarClock className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Evento fuera de la fecha programada</p>
            <p className="text-xs mt-0.5 text-amber-700">{dateStatus.text}</p>
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

        <div className="px-6 py-5 space-y-6">
          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-700">Datos del evento</h3>
            </div>
            <dl className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 rounded-xl overflow-hidden">
              <div className="bg-white px-4 py-3.5">{label('Número')}{value(event.numeroEvento)}</div>
              <div className="bg-white px-4 py-3.5">{label('Sufijo')}{value(event.sufijo || '-')}</div>
              <div className="bg-white px-4 py-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>{label('Fecha del evento')}{value(event.fechaEvento ? formatDateCO(event.fechaEvento) : '-')}</div>
                  <div>{label('Días')}{value(String(event.dias))}</div>
                </div>
              </div>
              <div className="bg-white px-4 py-3.5">{label('Responsable')}{value(event.responsable || '-')}</div>
              <div className="bg-white px-4 py-3.5">{label('Dependencia')}{value(event.dependencia || '-')}</div>
              <div className="bg-white px-4 py-3.5">{label('Asistentes')}{value(String(event.asistentes))}</div>
            </dl>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <MapPin className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-700">Ubicación</h3>
            </div>
            <dl className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 rounded-xl overflow-hidden">
              <div className="bg-white px-4 py-3.5">{label('Municipio')}{value(municipio ? `${municipio.nombre} (${municipio.departamento})` : event.municipioId)}</div>
              <div className="bg-white px-4 py-3.5">{label('Vereda')}{value(event.vereda || '-')}</div>
              <div className="bg-white px-4 py-3.5">
                {label('Coordenadas')}
                {event.latitud && event.longitud ? (
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{event.latitud}, {event.longitud}</p>
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 active:scale-[0.98] transition-all duration-150"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver en mapa
                    </button>
                  </div>
                ) : (
                  value('No registradas')
                )}
              </div>
            </dl>
          </section>

          <section>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-slate-700">Recursos</h3>
            </div>
            <dl className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 rounded-xl overflow-hidden">
              <div className="bg-white px-4 py-3.5">{label('Aliado')}{value(aliado?.nombre ?? event.aliadoId)}</div>
              <div className="bg-white px-4 py-3.5">{label('Recurso disponible')}{value(desembolso?.nombre ?? event.desembolsoId)}</div>
              <div className="bg-white px-4 py-3.5">
                {label('Esquema')}
                <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-semibold text-primary bg-primary/10 rounded capitalize">{event.esquema}</span>
              </div>
              {event.observaciones && (
                <div className="bg-white px-4 py-3.5 col-span-2 lg:col-span-3">
                  {label('Observaciones')}
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">{event.observaciones}</p>
                </div>
              )}
            </dl>
          </section>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/60 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-3.5 h-3.5" />
              </span>
              Totales de la orden
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <div className="text-right">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Base</p>
                <p className="text-sm font-bold text-slate-900 mt-1 tabular-nums">{formatCurrencyCO(ofertaTotals?.base ?? eventTotals.baseTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Impuestos</p>
                <p className="text-sm font-bold text-slate-900 mt-1 tabular-nums">{formatCurrencyCO(ofertaTotals?.impuestos ?? eventTotals.impuestosTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">FEE</p>
                <p className="text-sm font-bold text-slate-900 mt-1 tabular-nums">{formatCurrencyCO(ofertaTotals?.fee ?? eventTotals.feeTotal)}</p>
              </div>
              <div className="pl-6 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-extrabold text-primary mt-1 tabular-nums">{formatCurrencyCO(ofertaTotals?.total ?? 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className={activeTab === 'cotizaciones' ? '' : 'hidden'}>
        <QuotationList
        eventoId={event.id}
        event={event}
        offers={offers}
        selectedOfferId={event.cotizacionSeleccionadaId}
        onSelectOffer={handleSelectOffer}
        onValidateOffer={handleValidateOffer}
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
          canEditFolder={canEditFolder}
          eventStatus={displayEstado}
          devolucionLegalizacion={esDevolucionLegalizacion}
          devueltoDesde={localEvent?.devueltoDesde ?? event.devueltoDesde ?? null}
          quotationApproved={quotationApproved}
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
        readOnly={itemsReadOnly}
        lockReasons={lockReasons}
        eventAliadoId={event.aliadoId}
        schemaType={event.esquema}
      />
      </div>

      <div className={activeTab === 'pagos' ? '' : 'hidden'}>
        <PaymentsSection
          eventId={event.id}
          defaultDisbursementId={event.desembolsoId}
          readOnly={TERMINAL_STATES.includes(displayEstado)}
          items={event.items ?? []}
          offerItems={ofertaEconomica?.items}
        />
      </div>

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

      {showMap && event.latitud && event.longitud && (
        <MapViewer
          latitud={event.latitud}
          longitud={event.longitud}
          municipio={municipio ? `${municipio.nombre} (${municipio.departamento})` : undefined}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  )
}
