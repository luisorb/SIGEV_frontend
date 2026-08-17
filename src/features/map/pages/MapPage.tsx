import { useEffect, useMemo, useState, useRef } from 'react'
import { ExecutionMap } from '../components/ExecutionMap'
import { useQuery } from '@tanstack/react-query'
import { getMunicipalityStatsApi, searchMunicipalitiesApi } from '../../../services/map.service'
import type { MunicipalityResponse } from '../../../services/map.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { useAuth } from '../../auth/useAuth'
import { EVENT_STATES } from '../../../config/constants'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { MapPin, SlidersHorizontal, X, AlertTriangle, RotateCcw, Loader2 } from 'lucide-react'

export function MapPage() {
  const { data: aliados = [] } = useAllies({ all: true })
  const { data: desembolsos = [] } = useDisbursements()
  const { user } = useAuth()
  const isSolicitante = user?.roleNames.includes('solicitante') ?? false

  const [selectedDesembolso, setSelectedDesembolso] = useState('')
  const [selectedAliado, setSelectedAliado] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<MunicipalityResponse[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedMunicipio, setSelectedMunicipio] = useState<MunicipalityResponse | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const statsQuery = useQuery({
    queryKey: ['map-stats', selectedDesembolso, selectedAliado, selectedEstado],
    queryFn: () =>
      getMunicipalityStatsApi({
        disbursementId: selectedDesembolso || undefined,
        generalAllyId: selectedAliado || undefined,
        status: selectedEstado || undefined,
      }),
  })

  const groups = useMemo(() => statsQuery.data ?? [], [statsQuery.data])

  const groupsByRole = useMemo(() => {
    if (!isSolicitante) return groups
    const userName = user?.nombre ?? ''
    return groups
      .map((g) => ({
        ...g,
        eventos: g.eventos.filter((e) => e.responsable === userName),
      }))
      .filter((g) => g.eventos.length > 0)
      .map((g) => ({ ...g, totalEventos: g.eventos.length }))
  }, [groups, isSolicitante, user?.nombre])

  useEffect(() => {
    if (selectedMunicipio) return
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([])
        setSearchOpen(false)
        return
      }
      try {
        const data = await searchMunicipalitiesApi({ name: searchTerm.trim() })
        setSearchResults(data)
        setSearchOpen(true)
      } catch {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedMunicipio])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const visibleGroups = useMemo(() => {
    if (!selectedMunicipio) return groupsByRole
    const id = selectedMunicipio.divipolaCode ?? selectedMunicipio.id
    return groupsByRole.filter((g) => g.municipioId === id)
  }, [groupsByRole, selectedMunicipio])

  const aliadosMap = useMemo(() => {
    const m: Record<string, { nombre: string; color: string }> = {}
    for (const a of aliados) m[a.id] = { nombre: a.nombre, color: a.color }
    return m
  }, [aliados])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedDesembolso) count++
    if (selectedAliado) count++
    if (selectedEstado) count++
    return count
  }, [selectedDesembolso, selectedAliado, selectedEstado])

  function selectMunicipio(mun: MunicipalityResponse) {
    setSelectedMunicipio(mun)
    setSearchTerm(`${mun.name} (${mun.department})`)
    setSearchOpen(false)
  }

  function clearMunicipio() {
    setSelectedMunicipio(null)
    setSearchTerm('')
    setSearchOpen(false)
  }

  function clearAllFilters() {
    setSelectedDesembolso('')
    setSelectedAliado('')
    setSelectedEstado('')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 mb-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Mapa de Ejecución</h1>
            <p className="text-sm text-slate-500 mt-1">
              Visualiza la ubicación de los eventos por municipio. Usa los filtros para refinar la búsqueda.
            </p>
          </div>
      </div>

      <div className="shrink-0 flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 mb-4">
        <div ref={searchRef} className="relative min-w-[220px] flex-1 max-w-sm">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setSearchOpen(true) }}
            placeholder="Buscar municipio..."
            className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearMunicipio}
              title="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {searchOpen && searchResults.length > 0 && (
            <ul className="absolute z-30 mt-1 w-full max-h-64 overflow-auto bg-white border border-slate-200 rounded-xl shadow-xl">
              {searchResults.map((m) => (
                <li key={m.divipolaCode ?? m.id}>
                  <button
                    type="button"
                    onClick={() => selectMunicipio(m)}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{m.name} <span className="text-slate-400">({m.department})</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchOpen && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
              <span className="text-slate-400">Sin resultados para "{searchTerm}"</span>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
            showFilters
              ? 'text-primary bg-primary/5 border border-primary/30 ring-2 ring-primary/15'
              : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-primary rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {showFilters && (
        <div className="shrink-0 flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 mb-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros activos:
          </div>
          <SearchableSelect
            size="sm"
            className="w-52"
            options={desembolsos.map((d) => ({ value: d.id, label: d.nombre }))}
            value={selectedDesembolso}
            onChange={setSelectedDesembolso}
            placeholder="Todos los recursos"
          />
          <SearchableSelect
            size="sm"
            className="w-52"
            options={aliados.map((a) => ({ value: a.id, label: a.nombre, color: a.color }))}
            value={selectedAliado}
            onChange={setSelectedAliado}
            placeholder="Todos los aliados"
          />
          <SearchableSelect
            size="sm"
            className="w-44"
            options={EVENT_STATES.map((s) => ({ value: s, label: s }))}
            value={selectedEstado}
            onChange={setSelectedEstado}
            placeholder="Todos los estados"
          />
        </div>
      )}

      <div className="flex-1 min-h-[400px] max-h-[calc(100vh-280px)] rounded-xl overflow-hidden relative z-0">
        {statsQuery.isLoading && groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-500">Cargando mapa...</p>
            <p className="text-xs text-slate-400 mt-1">Obteniendo datos de ejecución</p>
          </div>
        ) : statsQuery.isError ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-xl border border-slate-200">
            <div className="p-3 bg-rose-50 rounded-xl mb-3">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">Error al cargar el mapa</p>
            <p className="text-xs text-slate-500 mt-1 mb-3">No se pudieron obtener los datos de ejecución</p>
            <button
              onClick={() => statsQuery.refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-xl border border-slate-200">
            <MapPin className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">Sin eventos para mostrar</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
              {selectedMunicipio
                ? 'No hay eventos registrados en este municipio con los filtros actuales'
                : 'Intenta ajustar los filtros para ver eventos en el mapa'}
            </p>
            {(selectedMunicipio || activeFilterCount > 0) && (
              <button
                onClick={() => { clearMunicipio(); clearAllFilters() }}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <ExecutionMap groups={visibleGroups} aliadosMap={aliadosMap} />
        )}
      </div>
    </div>
  )
}
