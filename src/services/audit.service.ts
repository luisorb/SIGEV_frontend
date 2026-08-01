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

export async function getAuditApi(): Promise<AuditEntry[]> {
  try {
    const response = await api.get<BackendAuditLog[]>('/api/v1/audit')
    return (response.data ?? []).map(mapBackendAudit)
  } catch {
    return []
  }
}
