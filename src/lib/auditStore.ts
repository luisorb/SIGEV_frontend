import type { AuditEntry } from '../types'

let auditLog: AuditEntry[] = [
  { id: 'aud-001', accion: 'Creación de evento', entidad: 'Event', entidadId: 'EVT-001', usuario: 'Admin SIGEV', fecha: '2025-07-25T10:00:00Z', detalle: 'Evento EVT-001 creado' },
  { id: 'aud-002', accion: 'Cambio de estado', entidad: 'Event', entidadId: 'EVT-001', usuario: 'Admin SIGEV', fecha: '2025-07-25T14:30:00Z', detalle: 'Estado cambiado de Abierto a En ejecucion' },
  { id: 'aud-003', accion: 'Creación de evento', entidad: 'Event', entidadId: 'EVT-002', usuario: 'Admin SIGEV', fecha: '2025-07-26T09:00:00Z', detalle: 'Evento EVT-002 creado' },
]

let nextAuditId = 4

export function addAuditEntry(entry: Omit<AuditEntry, 'id'>): AuditEntry {
  const newEntry: AuditEntry = { id: `aud-${String(nextAuditId++).padStart(3, '0')}`, ...entry }
  auditLog = [newEntry, ...auditLog]
  return newEntry
}

export function getAuditEntries(filters?: { entidad?: string; accion?: string }): AuditEntry[] {
  let result = [...auditLog]
  if (filters?.entidad) result = result.filter((e) => e.entidad === filters.entidad)
  if (filters?.accion) result = result.filter((e) => e.accion === filters.accion)
  return result
}

export function getAllAuditEntries(): AuditEntry[] {
  return [...auditLog]
}
