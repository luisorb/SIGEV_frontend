import { useState, useMemo, useCallback, useEffect } from 'react'
import type { CalculationParams } from '../../../types'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser, DEFAULT_CALCULATION_PARAMS } from '../../../config/constants'
import { getActiveParametersApi, getParameterVersionsApi, createParameterVersionApi } from '../../../services/parameters.service'
import type { ParametersResponse } from '../../../services/parameters.service'
import type { ParamVersion } from '../types'

function mapResponseToParamVersion(data: ParametersResponse): ParamVersion {
  return {
    id: data.id,
    version: data.version,
    params: {
      ivaRate: data.ivaRate,
      impuestoConsumoRate: data.impuestoConsumoRate,
      feeTarifadoRate: data.feeTarifadoRate,
      feeTercerosRate: data.feeTercerosRate,
      ivaFeeRate: data.ivaFeeRate,
      applyFeeOnBase: data.applyFeeOnBase,
      paramsVersion: data.paramsVersion ?? `${data.version}.0`,
    },
    aprobadoPor: data.aprobadoPor,
    fechaCreacion: data.fechaCreacion,
    activo: data.activo,
  }
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
  const [versions, setVersions] = useState<ParamVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editParams, setEditParams] = useState<CalculationParams>(cloneParams(DEFAULT_CALCULATION_PARAMS))
  const [baseParams, setBaseParams] = useState<CalculationParams>(cloneParams(DEFAULT_CALCULATION_PARAMS))
  const [loadedVersionId, setLoadedVersionId] = useState<string | null>(null)
  const [aprobadoPor, setAprobadoPor] = useState(getCurrentUser())
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [activeParams, allVersions] = await Promise.all([
          getActiveParametersApi(),
          getParameterVersionsApi(),
        ])
        const mappedVersions = allVersions.map(mapResponseToParamVersion)
        setVersions(mappedVersions)

        if (activeParams) {
          const mapped = mapResponseToParamVersion(activeParams)
          const p = cloneParams(mapped.params)
          setEditParams(p)
          setBaseParams(p)
          setLoadedVersionId(mapped.id)
        }
        setError(null)
      } catch {
        setError('No se pudieron cargar los parámetros desde el servidor.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

  const saveNewVersion = useCallback(async () => {
    if (!isDirty) {
      setSaveMessage({ type: 'error', text: 'No hay cambios para guardar.' })
      return
    }
    if (!aprobadoPor.trim()) {
      setSaveMessage({ type: 'error', text: 'Debes ingresar quién aprueba los cambios.' })
      return
    }

    setSaving(true)
    try {
      const roundedParams = {
        ivaRate: Math.round(editParams.ivaRate * 10000) / 10000,
        impuestoConsumoRate: Math.round(editParams.impuestoConsumoRate * 10000) / 10000,
        feeTarifadoRate: Math.round(editParams.feeTarifadoRate * 10000) / 10000,
        feeTercerosRate: Math.round(editParams.feeTercerosRate * 10000) / 10000,
        ivaFeeRate: Math.round(editParams.ivaFeeRate * 10000) / 10000,
        applyFeeOnBase: editParams.applyFeeOnBase,
        aprobadoPor: aprobadoPor.trim(),
      }

      const created = await createParameterVersionApi(roundedParams)
      const mapped = mapResponseToParamVersion(created)

      const updated = versions.map((v) => (v.activo ? { ...v, activo: false } : v))
      updated.push(mapped)
      setVersions(updated)
      setEditParams(cloneParams(mapped.params))
      setBaseParams(cloneParams(mapped.params))
      setLoadedVersionId(mapped.id)
      setSaveMessage({ type: 'success', text: `Versión ${mapped.version} guardada exitosamente.` })

      addAuditEntry({
        accion: 'Actualización de parámetros',
        entidad: 'Param',
        entidadId: mapped.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Nueva versión ${mapped.version} de parámetros de cálculo. Aprobado por: ${aprobadoPor}`,
      })
    } catch {
      setSaveMessage({ type: 'error', text: 'Error al guardar la versión. Intenta nuevamente.' })
    } finally {
      setSaving(false)
    }
  }, [isDirty, aprobadoPor, editParams, versions])

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
    loading,
    error,
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
    saving,
    clearSaveMessage: () => setSaveMessage(null),
  }
}
