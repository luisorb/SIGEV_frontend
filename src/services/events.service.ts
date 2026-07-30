import api from '../lib/api'
import type { CreateEventDto, ChangeStatusDto } from './types'
import type { Event, Item, EventState, SchemaType } from '../types'

function mapBackendEvent(data: Record<string, unknown>): Event {
  return {
    id: String(data.id ?? ''),
    numeroEvento: String(data.code ?? data.numeroEvento ?? ''),
    sufijo: String(data.suffix ?? ''),
    responsable: String(data.responsible ?? data.responsable ?? ''),
    dependencia: String(data.dependency ?? data.dependencia ?? ''),
    fechaEvento: String(data.eventDate ?? data.fechaEvento ?? ''),
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
    estado: (data.status ?? data.estado ?? 'Abierto') as EventState,
    items: (data.items as Item[]) ?? [],
    asignadoA: String(data.assignedTo ?? data.asignadoA ?? ''),
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    updatedAt: String(data.updatedAt ?? new Date().toISOString()),
  }
}

function mapToCreateDto(event: Partial<Event>): CreateEventDto {
  return {
    code: event.numeroEvento || '',
    name: event.responsable || '',
    description: event.observaciones,
    divipolaCode: event.municipioId,
    municipalityName: '',
    municipalityCategory: '',
    generalAllyId: event.aliadoId,
    items: event.items?.length ? event.items.map((i) => ({
      name: i.descripcion,
      quantity: i.cantidad,
      unitPrice: i.valorUnitario,
      ivaRate: i.categoriaTributaria === 'IVA' ? 0.19 : 0,
      consumptionTaxRate: i.categoriaTributaria === 'Consumo' ? 0.08 : 0,
      allyId: i.aliadoId,
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

export async function changeEventStatusApi(id: string, status: string): Promise<void> {
  await api.patch(`/api/v1/events/${id}/status`, { status } as ChangeStatusDto)
}
