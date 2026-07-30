import { useState, useMemo, useCallback } from 'react'
import type { CalculationParams } from '../../../types'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser, DEFAULT_CALCULATION_PARAMS } from '../../../config/constants'
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

function paramsEqual(a: CalculationParams, b: CalculationParams) {
  return (
    a.ivaRate === b.ivaRate &&
    a.impuestoConsumoRate === b.impuestoConsumoRate &&
    a.feeTarifadoRate === b.feeTarifadoRate &&
    a.feeTercerosRate === b.feeTercerosRate &&
    a.ivaFeeRate === b.ivaFeeRate &&
    a.applyFeeOnBase === b.applyFeeOnBase
  )
}

export function useParameters() {
  const [versions, setVersions] = useState<ParamVersion[]>(loadVersions)

  const getActiveParams = () => {
    const active = loadVersions().find((v) => v.activo)
    return active?.params ?? DEFAULT_CALCULATION_PARAMS
  }

  const [editParams, setEditParams] = useState<CalculationParams>(() => cloneParams(getActiveParams()))
  const [baseParams, setBaseParams] = useState<CalculationParams>(() => cloneParams(getActiveParams()))
  const [loadedVersionId, setLoadedVersionId] = useState<string | null>(null)
  const [aprobadoPor, setAprobadoPor] = useState(getCurrentUser())
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const activeVersion = useMemo(() => versions.find((v) => v.activo) ?? null, [versions])

  const currentVersion = useMemo(() => {
    if (!loadedVersionId) return activeVersion
    return versions.find((v) => v.id === loadedVersionId) ?? activeVersion
  }, [versions, loadedVersionId, activeVersion])

  const isDirty = useMemo(() => !paramsEqual(baseParams, editParams), [baseParams, editParams])

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

    const roundedParams: CalculationParams = {
      ...editParams,
      ivaRate: Math.round(editParams.ivaRate * 10000) / 10000,
      impuestoConsumoRate: Math.round(editParams.impuestoConsumoRate * 10000) / 10000,
      feeTarifadoRate: Math.round(editParams.feeTarifadoRate * 10000) / 10000,
      feeTercerosRate: Math.round(editParams.feeTercerosRate * 10000) / 10000,
      ivaFeeRate: Math.round(editParams.ivaFeeRate * 10000) / 10000,
    }
    const newVersion: ParamVersion = {
      id: `pv-${String(nextVersion).padStart(3, '0')}`,
      version: nextVersion,
      params: { ...roundedParams, paramsVersion: `${nextVersion}.0` },
      aprobadoPor: aprobadoPor.trim(),
      fechaCreacion: new Date().toISOString(),
      activo: true,
    }

    const updated = versions.map((v) => (v.activo ? { ...v, activo: false } : v))
    updated.push(newVersion)
    setVersions(updated)
    persistVersions(updated)
    setEditParams(cloneParams(roundedParams))
    setBaseParams(cloneParams(roundedParams))
    setLoadedVersionId(newVersion.id)
    setSaveMessage({ type: 'success', text: `Versión ${newVersion.version} guardada exitosamente.` })

    addAuditEntry({
      accion: 'Actualización de parámetros',
      entidad: 'Param',
      entidadId: newVersion.id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Nueva versión ${newVersion.version} de parámetros de cálculo. Aprobado por: ${aprobadoPor}`,
    })
  }, [isDirty, aprobadoPor, editParams, versions, nextVersion])

  function loadVersion(versionId: string) {
    const version = versions.find((v) => v.id === versionId)
    if (version) {
      const p = cloneParams(version.params)
      setEditParams(p)
      setBaseParams(p)
      setLoadedVersionId(versionId)
      setAprobadoPor(version.aprobadoPor)
      setSaveMessage(null)
    }
  }

  function discardChanges() {
    const p = activeVersion
      ? cloneParams(activeVersion.params)
      : cloneParams(DEFAULT_CALCULATION_PARAMS)
    setEditParams(p)
    setBaseParams(p)
    setLoadedVersionId(activeVersion?.id ?? null)
    setAprobadoPor(activeVersion ? activeVersion.aprobadoPor : getCurrentUser())
    setSaveMessage(null)
  }

  return {
    editParams,
    updateParam,
    versions,
    activeVersion,
    currentVersion,
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
