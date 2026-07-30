import { useState, useCallback } from 'react'
import type { Ally, Disbursement } from '../types'
import { addAuditEntry } from './auditStore'
import { getCurrentUser } from '../config/constants'

const ALIADOS_KEY = 'sigev-aliados'
const DESEMBOLSOS_KEY = 'sigev-desembolsos'

let nextAllyId = 4
let nextDesembolsoId = 4

function seedIfEmpty<T>(key: string, mockData: T[]): T[] {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      const parsed = JSON.parse(saved) as T[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* fall through */ }
  localStorage.setItem(key, JSON.stringify(mockData))
  return mockData
}

function loadAliados(): Ally[] {
  return seedIfEmpty(ALIADOS_KEY, getMockAliados())
}

function loadDesembolsos(): Disbursement[] {
  return seedIfEmpty(DESEMBOLSOS_KEY, getMockDesembolsos())
}

function persistAliados(list: Ally[]) {
  localStorage.setItem(ALIADOS_KEY, JSON.stringify(list))
}

function persistDesembolsos(list: Disbursement[]) {
  localStorage.setItem(DESEMBOLSOS_KEY, JSON.stringify(list))
}

function getMockAliados(): Ally[] {
  return [
    { id: '1', nombre: 'Fundación Social', nit: '900.123.456-7', contacto: 'Carlos Pérez', email: 'carlos@fsocial.org', telefono: '3001234567', color: '#EAB308', activo: true },
    { id: '2', nombre: 'Corporación Desarrollo', nit: '900.789.012-3', contacto: 'Ana Gómez', email: 'ana@codesarrollo.org', telefono: '3007890123', color: '#f43340', activo: true },
    { id: '3', nombre: 'Asociación Cultural', nit: '900.345.678-9', contacto: 'Luis Rojas', email: 'luis@acultural.org', telefono: '3003456789', color: '#22C55E', activo: true },
  ]
}

function getMockDesembolsos(): Disbursement[] {
  return [
    { id: '1', nombre: 'Desembolso 2025-01', codigo: 'D2025-01', porcentajeParticipacion: 40, vigencia: '2025-01-01', valorReferencia: 500_000_000, activo: true },
    { id: '2', nombre: 'Desembolso 2025-02', codigo: 'D2025-02', porcentajeParticipacion: 35, vigencia: '2025-06-01', valorReferencia: 400_000_000, activo: true },
    { id: '3', nombre: 'Desembolso 2025-03', codigo: 'D2025-03', porcentajeParticipacion: 25, vigencia: '2025-01-01', valorReferencia: 300_000_000, activo: true },
  ]
}

// --- Exported hooks ---

export function useAliados() {
  const [aliados, setAliados] = useState<Ally[]>(loadAliados)

  const refresh = useCallback(() => setAliados(loadAliados()), [])

  const addAliado = useCallback((data: Omit<Ally, 'id'>) => {
    const list = loadAliados()
    const nuevo: Ally = { id: String(nextAllyId++), ...data }
    const updated = [...list, nuevo]
    persistAliados(updated)
    setAliados(updated)
    addAuditEntry({
      accion: 'Creación de aliado',
      entidad: 'Ally',
      entidadId: nuevo.id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Aliado "${nuevo.nombre}" creado`,
    })
    return nuevo
  }, [])

  const updateAliado = useCallback((id: string, data: Partial<Ally>) => {
    const list = loadAliados()
    const updated = list.map((a) => (a.id === id ? { ...a, ...data } : a))
    persistAliados(updated)
    setAliados(updated)
    addAuditEntry({
      accion: 'Edición de aliado',
      entidad: 'Ally',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Aliado actualizado`,
    })
  }, [])

  const toggleActivo = useCallback((id: string) => {
    const list = loadAliados()
    const aliado = list.find((a) => a.id === id)
    if (!aliado) return
    const updated = list.map((a) =>
      a.id === id ? { ...a, activo: !a.activo } : a,
    )
    persistAliados(updated)
    setAliados(updated)
    addAuditEntry({
      accion: aliado.activo ? 'Inactivación de aliado' : 'Activación de aliado',
      entidad: 'Ally',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Aliado "${aliado.nombre}" ${aliado.activo ? 'inactivado' : 'activado'}`,
    })
  }, [])

  return { aliados, addAliado, updateAliado, toggleActivo, refresh }
}

export function useDesembolsos() {
  const [desembolsos, setDesembolsos] = useState<Disbursement[]>(loadDesembolsos)

  const refresh = useCallback(() => setDesembolsos(loadDesembolsos()), [])

  const addDesembolso = useCallback((data: Omit<Disbursement, 'id'>) => {
    const list = loadDesembolsos()
    const nuevo: Disbursement = { id: String(nextDesembolsoId++), ...data }
    const updated = [...list, nuevo]
    persistDesembolsos(updated)
    setDesembolsos(updated)
    addAuditEntry({
      accion: 'Creación de desembolso',
      entidad: 'Disbursement',
      entidadId: nuevo.id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Desembolso "${nuevo.nombre}" creado`,
    })
    return nuevo
  }, [])

  const updateDesembolso = useCallback((id: string, data: Partial<Disbursement>) => {
    const list = loadDesembolsos()
    const updated = list.map((d) => (d.id === id ? { ...d, ...data } : d))
    persistDesembolsos(updated)
    setDesembolsos(updated)
    addAuditEntry({
      accion: 'Edición de desembolso',
      entidad: 'Disbursement',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Desembolso actualizado`,
    })
  }, [])

  const toggleActivo = useCallback((id: string) => {
    const list = loadDesembolsos()
    const des = list.find((d) => d.id === id)
    if (!des) return
    const updated = list.map((d) =>
      d.id === id ? { ...d, activo: !d.activo } : d,
    )
    persistDesembolsos(updated)
    setDesembolsos(updated)
    addAuditEntry({
      accion: des.activo ? 'Inactivación de desembolso' : 'Activación de desembolso',
      entidad: 'Disbursement',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Desembolso "${des.nombre}" ${des.activo ? 'inactivado' : 'activado'}`,
    })
  }, [])

  return { desembolsos, addDesembolso, updateDesembolso, toggleActivo, refresh }
}

// --- Static helpers (for components that don't need reactivity) ---

export function getAliadosSync(): Ally[] {
  return loadAliados()
}

export function getDesembolsosSync(): Disbursement[] {
  return loadDesembolsos()
}
