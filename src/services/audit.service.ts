import api from '../lib/api'
import type { AuditEntry } from '../types'

interface BackendAuditLog {
  id: string
  entityType?: string | null
  entityId?: string | null
  action?: string | null
  previousValue?: unknown
  newValue?: unknown
  userId?: string | null
  userEmail?: string | null
  ipAddress?: string | null
  createdAt?: string | null
}

const ENTIDAD_MAP: Record<string, string> = {
  events: 'Event',
  offers: 'Offer',
  items: 'Item',
  allies: 'Ally',
  users: 'User',
  parameters: 'Param',
  params: 'Param',
  municipalities: 'Municipality',
  disbursements: 'Disbursement',
}

const ENTIDAD_LABEL_TO_KEYS: Record<string, string[]> = {}
for (const [key, label] of Object.entries(ENTIDAD_MAP)) {
  if (!ENTIDAD_LABEL_TO_KEYS[label]) ENTIDAD_LABEL_TO_KEYS[label] = []
  ENTIDAD_LABEL_TO_KEYS[label].push(key)
}

function methodToAccion(action: string): string {
  const method = action.split(' ')[0]?.toUpperCase()
  const url = action.split(' ')[1] ?? ''
  if (method === 'DELETE') return 'Eliminación'
  if (url.includes('/status')) return 'Cambio de estado'
  if (method === 'POST') return 'Creación'
  if (method === 'PATCH' || method === 'PUT') return 'Actualización'
  return action || 'Acción'
}

function entityLabel(entityType?: string | null): string {
  if (!entityType) return '—'
  const key = entityType.toLowerCase().replace(/^\/+/, '').split('/')[0]
  return ENTIDAD_MAP[key] ?? entityType
}

function mapBackendAudit(log: BackendAuditLog): AuditEntry {
  return {
    id: log.id ?? `aud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    usuario: log.userEmail ?? log.userId ?? 'Sistema',
    accion: methodToAccion(log.action ?? ''),
    entidad: entityLabel(log.entityType ?? ''),
    entidadId: String(log.entityId ?? ''),
    detalle: log.action ?? '',
    valorAnterior: log.previousValue
      ? JSON.stringify(log.previousValue)
      : undefined,
    valorNuevo: log.newValue
      ? JSON.stringify(log.newValue)
      : undefined,
    fecha: log.createdAt ?? new Date().toISOString(),
    origen: 'servidor',
  }
}

export interface GetAuditParams {
  page?: number
  pageSize?: number
  search?: string
  entidad?: string
  accion?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface PaginatedAudit {
  data: AuditEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface BackendPaginatedAudit {
  data: BackendAuditLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getAuditApi(params: GetAuditParams = {}): Promise<PaginatedAudit> {
  const empty: PaginatedAudit = {
    data: [],
    total: 0,
    page: params.page ?? 0,
    pageSize: params.pageSize ?? 10,
    totalPages: 0,
  }
  try {
    const query: Record<string, string> = {}
    if (params.page !== undefined) query.page = String(params.page + 1)
    if (params.pageSize !== undefined) query.pageSize = String(params.pageSize)
    if (params.search?.trim()) query.search = params.search.trim()
    if (params.entidad) {
      const keys = ENTIDAD_LABEL_TO_KEYS[params.entidad]
      if (keys?.length) query.entity = keys.join(',')
    }
    if (params.accion) query.action = params.accion
    if (params.sortBy) query.sortBy = params.sortBy
    if (params.sortDir) query.sortDir = params.sortDir

    const response = await api.get<BackendPaginatedAudit>('/api/v1/audit', { params: query })
    const res = response.data
    return {
      data: (res?.data ?? []).map(mapBackendAudit),
      total: res?.total ?? 0,
      page: res?.page ?? 1,
      pageSize: res?.pageSize ?? params.pageSize ?? 10,
      totalPages: res?.totalPages ?? 0,
    }
  } catch {
    return empty
  }
}
