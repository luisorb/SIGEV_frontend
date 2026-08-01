import { useState, useCallback } from 'react'
import type { Ally, Disbursement } from '../types'
import { addAuditEntry } from './auditStore'
import { getCurrentUser } from '../config/constants'

const ALIADOS_KEY = 'sigev-aliados'
const DESEMBOLSOS_KEY = 'sigev-desembolsos'

function loadAliados(): Ally[] {
  try {
    const saved = localStorage.getItem(ALIADOS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Ally[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch { void 0 }
  return []
}

function loadDesembolsos(): Disbursement[] {
  try {
    const saved = localStorage.getItem(DESEMBOLSOS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Disbursement[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch { void 0 }
  return []
}

function persistAliados(list: Ally[]) {
  localStorage.setItem(ALIADOS_KEY, JSON.stringify(list))
}

function persistDesembolsos(list: Disbursement[]) {
  localStorage.setItem(DESEMBOLSOS_KEY, JSON.stringify(list))
}

function nextId(list: { id: string }[]): number {
  const max = list.reduce((m, item) => Math.max(m, parseInt(item.id, 10) || 0), 0)
  return max + 1
}

export function useAliados() {
  const [aliados, setAliados] = useState<Ally[]>(loadAliados)

  const addAliado = useCallback((data: Omit<Ally, 'id'>) => {
    const list = loadAliados()
    const nuevo: Ally = { id: String(nextId(list)), ...data }
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
      detalle: 'Aliado actualizado',
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

  return { aliados, addAliado, updateAliado, toggleActivo }
}

export function useDesembolsos() {
  const [desembolsos, setDesembolsos] = useState<Disbursement[]>(loadDesembolsos)

  const addDesembolso = useCallback((data: Omit<Disbursement, 'id'>) => {
    const list = loadDesembolsos()
    const nuevo: Disbursement = { id: String(nextId(list)), ...data }
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
      detalle: 'Desembolso actualizado',
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

  return { desembolsos, addDesembolso, updateDesembolso, toggleActivo }
}
