import { useState, useMemo, useCallback } from 'react'
import type { CalculationParams } from '../../../types'
import { addAuditEntry } from '../../../lib/auditStore'
import { CURRENT_USER, DEFAULT_CALCULATION_PARAMS } from '../../../config/constants'
import { mockParamVersions } from '../utils/mockData'
import type { ParamVersion } from '../types'

const STORAGE_KEY = 'sigev-param-versions'

function loadVersions(): ParamVersion[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : mockParamVersions
  } catch {
    return mockParamVersions
  }
}

function persistVersions(versions: ParamVersion[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions))
  } catch { /* silent fail */ }
}

function cloneParams(p: CalculationParams): CalculationParams {
  return { ...p, paramsVersion: p.paramsVersion }
}

export function useParameters() {
  const [versions, setVersions] = useState<ParamVersion[]>(loadVersions)
  const [editParams, setEditParams] = useState<CalculationParams>(() => {
    const active = loadVersions().find((v) => v.activo)
    return cloneParams(active?.params ?? DEFAULT_CALCULATION_PARAMS)
  })
  const [aprobadoPor, setAprobadoPor] = useState(CURRENT_USER)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const activeVersion = useMemo(() => versions.find((v) => v.activo) ?? null, [versions])

  const isDirty = useMemo(() => {
    if (!activeVersion) return true
    const a = activeVersion.params
    const b = editParams
    return (
      a.ivaRate !== b.ivaRate ||
      a.impuestoConsumoRate !== b.impuestoConsumoRate ||
      a.feeTarifadoRate !== b.feeTarifadoRate ||
      a.feeTercerosRate !== b.feeTercerosRate ||
      a.ivaFeeRate !== b.ivaFeeRate ||
      a.applyFeeOnBase !== b.applyFeeOnBase
    )
  }, [activeVersion, editParams])

  const nextVersion = useMemo(() => {
    if (versions.length === 0) return 1
    return Math.max(...versions.map((v) => v.version)) + 1
  }, [versions])

  function updateParam(key: keyof CalculationParams, value: number | boolean) {
    setEditParams((prev) => ({ ...prev, [key]: value }))
    setSaveMessage(null)
  }

  const saveNewVersion = useCallback(() => {
    if (!isDirty) {
      setSaveMessage({ type: 'error', text: 'No hay cambios para guardar.' })
      return
    }
    if (!aprobadoPor.trim()) {
      setSaveMessage({ type: 'error', text: 'Debes ingresar quién aprueba los cambios.' })
      return
    }

    const newVersion: ParamVersion = {
      id: `pv-${String(nextVersion).padStart(3, '0')}`,
      version: nextVersion,
      params: { ...editParams, paramsVersion: `${nextVersion}.0` },
      aprobadoPor: aprobadoPor.trim(),
      fechaCreacion: new Date().toISOString(),
      activo: true,
    }

    const updated = versions.map((v) => (v.activo ? { ...v, activo: false } : v))
    updated.push(newVersion)
    setVersions(updated)
    persistVersions(updated)
    setSaveMessage({ type: 'success', text: `Versión ${newVersion.version} guardada exitosamente.` })

    addAuditEntry({
      accion: 'Actualización de parámetros',
      entidad: 'Param',
      entidadId: newVersion.id,
      usuario: CURRENT_USER,
      fecha: new Date().toISOString(),
      detalle: `Nueva versión ${newVersion.version} de parámetros de cálculo. Aprobado por: ${aprobadoPor}`,
    })
  }, [isDirty, aprobadoPor, editParams, versions, nextVersion])

  function loadVersion(versionId: string) {
    const version = versions.find((v) => v.id === versionId)
    if (version) {
      setEditParams(cloneParams(version.params))
      setAprobadoPor(version.aprobadoPor)
      setSaveMessage(null)
    }
  }

  function discardChanges() {
    if (activeVersion) {
      setEditParams(cloneParams(activeVersion.params))
      setAprobadoPor(activeVersion.aprobadoPor)
    } else {
      setEditParams(cloneParams(DEFAULT_CALCULATION_PARAMS))
      setAprobadoPor(CURRENT_USER)
    }
    setSaveMessage(null)
  }

  return {
    editParams,
    updateParam,
    versions,
    activeVersion,
    isDirty,
    nextVersion,
    aprobadoPor,
    setAprobadoPor,
    saveNewVersion,
    loadVersion,
    discardChanges,
    saveMessage,
    clearSaveMessage: () => setSaveMessage(null),
  }
}
