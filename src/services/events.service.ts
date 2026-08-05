import api from '../lib/api'
import type { CreateEventDto, ChangeStatusDto } from './types'
import type { Event, Item, EventState, SchemaType, Attachment, TaxCategory } from '../types'

function mapBackendItem(data: Record<string, unknown>): Item {
  const ivaRate = Number(data.ivaRate ?? 0)
  const consumptionTaxRate = Number(data.consumptionTaxRate ?? 0)
  const feeValue = Number(data.feeValue ?? 0)
  const categoriaTributaria: TaxCategory =
    ivaRate > 0 ? 'IVA' : consumptionTaxRate > 0 ? 'Consumo' : 'Tercero'
  const isTarifado = categoriaTributaria === 'IVA' || categoriaTributaria === 'Consumo'
  return {
    id: String(data.id ?? ''),
    eventoId: String(data.eventId ?? ''),
    descripcion: String(data.name ?? data.description ?? ''),
    unidadMedida: data.unitMeasure ? String(data.unitMeasure) : undefined,
    cantidad: Number(data.quantity ?? 0),
    valorUnitario: Number(data.unitPrice ?? 0),
    categoriaTributaria,
    aliadoId: data.allyId ? String(data.allyId) : undefined,
    tariffId: data.tariffId ? String(data.tariffId) : undefined,
    isTariffed: data.isTariffed === true,
    base: Number(data.baseValue ?? 0),
    iva: Number(data.ivaValue ?? 0),
    impuestoConsumo: Number(data.consumptionTaxValue ?? 0),
    feeTarifado: isTarifado ? feeValue : 0,
    feeTerceros: isTarifado ? 0 : feeValue,
    ivaFee: Number(data.feeIvaValue ?? 0),
    total: Number(data.totalValue ?? 0),
  }
}

function mapBackendEvent(data: Record<string, unknown>): Event {
  return {
    id: String(data.id ?? ''),
    numeroEvento: String(data.code ?? data.numeroEvento ?? ''),
    sufijo: String(data.suffix ?? ''),
    responsable: String(data.name ?? data.responsible ?? data.responsable ?? ''),
    dependencia: String(data.dependency ?? data.dependencia ?? ''),
    fechaEvento: String(data.startDate ?? data.eventDate ?? data.fechaEvento ?? '').slice(0, 10),
    asistentes: Number(data.attendees ?? data.asistentes ?? 0),
    dias: Number(data.days ?? data.dias ?? 0),
    municipioId: String(data.divipolaCode ?? data.municipioId ?? ''),
    vereda: String(data.hamlet ?? data.vereda ?? ''),
    latitud: Number(data.latitude ?? data.latitud) || undefined,
    longitud: Number(data.longitude ?? data.longitud) || undefined,
    observaciones: String(data.description ?? data.observaciones ?? ''),
    aliadoId: String(data.generalAllyId ?? data.aliadoId ?? ''),
    desembolsoId: String(data.disbursementId ?? data.desembolsoId ?? ''),
    esquema: (data.schemaType ?? data.esquema ?? 'cotizacion') as SchemaType,
    municipalityCategory: String(data.municipalityCategory ?? ''),
    estado: (data.status ?? data.estado ?? 'Abierto') as EventState,
    items: Array.isArray(data.items)
      ? (data.items as Record<string, unknown>[]).map(mapBackendItem)
      : [],
    asignadoA: String(data.assignedTo ?? data.asignadoA ?? ''),
    attachments: (data.attachments as Attachment[] | undefined) ?? undefined,
    quotations: Array.isArray(data.quotations)
      ? (data.quotations as Record<string, unknown>[]).map((q) => ({
          id: String(q.id ?? ''),
          code: String(q.code ?? ''),
          name: String(q.name ?? ''),
          description: q.description ? String(q.description) : undefined,
          cliente: q.cliente ? String(q.cliente) : undefined,
          eventId: q.eventId ? String(q.eventId) : undefined,
          allyId: q.allyId ? String(q.allyId) : undefined,
          amount: Number(q.amount ?? 0),
          currency: String(q.currency ?? 'COP'),
          status: String(q.status ?? 'Borrador'),
          isDefinitive: q.isDefinitive === true,
          createdAt: String(q.createdAt ?? ''),
          updatedAt: String(q.updatedAt ?? ''),
        }))
      : undefined,
    observation: String(data.observation ?? data.motivoDevolucion ?? '') || undefined,
    activo: data.isActive !== false,
    eliminadoAt: data.deletedAt ? String(data.deletedAt) : undefined,
    devolucionLegalizacion: data.devolucionLegalizacion === true,
    cotizacionSeleccionadaId: data.cotizacionSeleccionadaId ? String(data.cotizacionSeleccionadaId) : undefined,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
  }
}

function mapToCreateDto(event: Partial<Event>): CreateEventDto {
  return {
    code: event.numeroEvento || '',
    suffix: event.sufijo || undefined,
    schemaType: event.esquema ?? 'cotizacion',
    name: event.responsable || '',
    description: event.observaciones,
    dependency: event.dependencia || undefined,
    hamlet: event.vereda || undefined,
    attendees: event.asistentes,
    days: event.dias,
    latitude: event.latitud,
    longitude: event.longitud,
    divipolaCode: event.municipioId,
    municipalityName: '',
    municipalityCategory: '',
    generalAllyId: event.aliadoId,
    disbursementId: event.desembolsoId,
    startDate: event.fechaEvento || undefined,
    items: event.items?.length ? event.items.map((i) => ({
      name: i.descripcion,
      quantity: i.cantidad,
      ...(i.valorUnitario ? { unitPrice: i.valorUnitario } : {}),
      ...(i.unidadMedida ? { unitMeasure: i.unidadMedida } : {}),
      ...(i.aliadoId ? { allyId: i.aliadoId } : {}),
      ...(i.tariffId ? { tariffId: i.tariffId } : {}),
      ...(i.isTariffed !== undefined ? { isTariffed: i.isTariffed } : {}),
    })) : undefined,
  }
}

export async function getEventsApi(): Promise<Event[]> {
  const response = await api.get<unknown[]>('/api/v1/events')
  return (response.data as Record<string, unknown>[]).map(mapBackendEvent)
}

export async function getEventApi(id: string): Promise<Event | null> {
  const response = await api.get<Record<string, unknown>>(`/api/v1/events/${id}`)
  return mapBackendEvent(response.data)
}

export async function createEventApi(event: Partial<Event>): Promise<Event> {
  const dto = mapToCreateDto(event)
  const response = await api.post<Record<string, unknown>>('/api/v1/events', dto)
  return mapBackendEvent(response.data)
}

export async function updateEventApi(id: string, event: Partial<Event>): Promise<Event | null> {
  const response = await api.patch<Record<string, unknown>>(`/api/v1/events/${id}`, mapToCreateDto(event))
  return mapBackendEvent(response.data)
}

export async function deleteEventApi(id: string): Promise<void> {
  await api.delete(`/api/v1/events/${id}`)
}

export async function changeEventStatusApi(
  id: string,
  status: EventState,
  options?: { observation?: string; authorizeException?: boolean },
): Promise<void> {
  const dto: ChangeStatusDto = {
    status,
    ...(options?.observation !== undefined ? { observation: options.observation } : {}),
    ...(options?.authorizeException !== undefined ? { authorizeException: options.authorizeException } : {}),
  }
  await api.patch(`/api/v1/events/${id}/status`, dto)
}
