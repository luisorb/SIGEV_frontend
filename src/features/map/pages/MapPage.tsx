import { useEffect, useMemo, useState } from 'react'
import { ExecutionMap } from '../components/ExecutionMap'
import { useQuery } from '@tanstack/react-query'
import { getMunicipalityStatsApi, searchMunicipalitiesApi } from '../../../services/map.service'
import type { MunicipalityResponse } from '../../../services/map.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { EVENT_STATES } from '../../../config/constants'
import { SearchableSelect } from '../../../components/SearchableSelect'
import { MapPin, SlidersHorizontal, X } from 'lucide-react'

export function MapPage() {
  const { data: aliados = [] } = useAllies({ all: true })
  const { data: desembolsos = [] } = useDisbursements()

  const [selectedDesembolso, setSelectedDesembolso] = useState('')
  const [selectedAliado, setSelectedAliado] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<MunicipalityResponse[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedMunicipio, setSelectedMunicipio] = useState<MunicipalityResponse | null>(null)

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

  const visibleGroups = useMemo(() => {
    if (!selectedMunicipio) return groups
    const id = selectedMunicipio.divipolaCode ?? selectedMunicipio.id
    return groups.filter((g) => g.municipioId === id)
  }, [groups, selectedMunicipio])

  const aliadosMap = useMemo(() => {
    const m: Record<string, { nombre: string; color: string }> = {}
    for (const a of aliados) m[a.id] = { nombre: a.nombre, color: a.color }
    return m
  }, [aliados])

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mapa de Ejecución</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualiza en el mapa la ejecución de los eventos por municipio, con filtros por recurso disponible, aliado y estado, y consulta sus valores económicos.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar municipio..."
            className="w-full pl-9 pr-9 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {selectedMunicipio && (
            <button
              type="button"
              onClick={clearMunicipio}
              title="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {searchOpen && searchResults.length > 0 && (
            <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
              {searchResults.map((m) => (
                <li key={m.divipolaCode ?? m.id}>
                  <button
                    type="button"
                    onClick={() => selectMunicipio(m)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {m.name} ({m.department})
                  </button>
                </li>
              ))}
            </ul>
          )}
          {searchOpen && searchTerm.trim().length >= 2 && searchResults.length === 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm text-slate-500">
              Sin resultados
            </div>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-slate-50 transition-colors ${
            showFilters ? 'ring-2 ring-primary/30 border-primary' : ''
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          Filtros
        </button>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3">
          <SearchableSelect
            size="sm"
            className="w-44"
            options={desembolsos.map((d) => ({ value: d.id, label: d.nombre }))}
            value={selectedDesembolso}
            onChange={setSelectedDesembolso}
            placeholder="Todos los recursos disponibles"
          />
          <SearchableSelect
            size="sm"
            className="w-44"
            options={aliados.map((a) => ({ value: a.id, label: a.nombre, color: a.color }))}
            value={selectedAliado}
            onChange={setSelectedAliado}
            placeholder="Todos los aliados"
          />
          <SearchableSelect
            size="sm"
            className="w-36"
            options={EVENT_STATES.map((s) => ({ value: s, label: s }))}
            value={selectedEstado}
            onChange={setSelectedEstado}
            placeholder="Todos los estados"
          />
          </div>
        )}
      </div>

      <div className="h-[600px] rounded-xl overflow-hidden relative z-0">
        {statsQuery.isLoading && groups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Cargando mapa...</p>
          </div>
        ) : (
          <ExecutionMap groups={visibleGroups} aliadosMap={aliadosMap} />
        )}
      </div>
    </div>
  )
}
