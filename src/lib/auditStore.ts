import type { AuditEntry } from '../types'

let auditLog: AuditEntry[] = []

let nextAuditId = 1

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
