import { useEffect, useMemo, useState } from 'react'
import { ExecutionMap } from '../components/ExecutionMap'
import { useQuery } from '@tanstack/react-query'
import { getMunicipalityStatsApi, searchMunicipalitiesApi } from '../../../services/map.service'
import type { MunicipalityResponse } from '../../../services/map.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { formatCurrencyCO } from '../../../utils/formatters'
import { MapPin, X } from 'lucide-react'

export function MapPage() {
  const { data: aliados = [] } = useAllies()
  const { data: desembolsos = [] } = useDisbursements()

  const [selectedDesembolso, setSelectedDesembolso] = useState('')
  const [selectedAliado, setSelectedAliado] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')

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

  const totalMunicipios = visibleGroups.length
  const totalEventos = visibleGroups.reduce((s, g) => s + g.totalEventos, 0)
  const totalValor = visibleGroups.reduce((s, g) => s + g.totalValor, 0)

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
          {totalMunicipios} municipio{totalMunicipios !== 1 ? 's' : ''} · {totalEventos} evento{totalEventos !== 1 ? 's' : ''} · {formatCurrencyCO(totalValor)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar municipio..."
            className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedDesembolso} onChange={(e) => setSelectedDesembolso(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los desembolsos</option>
            {desembolsos.map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
          </select>
          <select value={selectedAliado} onChange={(e) => setSelectedAliado(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los aliados</option>
            {aliados.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
          </select>
          <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En ejecución">En ejecución</option>
            <option value="Ejecutado">Ejecutado</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Legalizado">Legalizado</option>
            <option value="Devuelto">Devuelto</option>
            <option value="Rechazado">Rechazado</option>
          </select>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 ml-auto">
          <span className="font-medium text-slate-700">Leyenda:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Abierto</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> En ejecución</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500" /> Ejecutado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Devuelto</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /> Legalizado</span>
        </div>
      </div>

      <div className="h-[600px] rounded-xl overflow-hidden">
        {statsQuery.isLoading && groups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">Cargando mapa...</p>
          </div>
        ) : (
          <ExecutionMap groups={visibleGroups} />
        )}
      </div>
    </div>
  )
}
