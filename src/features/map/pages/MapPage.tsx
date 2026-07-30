import { useMemo, useState, useEffect } from 'react'
import { useMapMarkers } from '../hooks/useMapMarkers'
import { ExecutionMap } from '../components/ExecutionMap'
import { mockCoordenadas } from '../utils/coordinates'
import { getEventsApi } from '../../../services/events.service'
import { getAliadosSync, getDesembolsosSync } from '../../../lib/catalogStore'
import { formatCurrencyCO } from '../../../utils/formatters'
import type { Event } from '../../../types'

export function MapPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEventsApi().then((data) => {
      setEvents(data)
      setLoading(false)
    })
  }, [])

  const [selectedDesembolso, setSelectedDesembolso] = useState('')
  const [selectedAliado, setSelectedAliado] = useState('')
  const [selectedEstado, setSelectedEstado] = useState('')

  const filteredEvents = useMemo(() => {
    let result = events
    if (selectedDesembolso) {
      result = result.filter((e) => e.desembolsoId === selectedDesembolso)
    }
    if (selectedAliado) {
      result = result.filter((e) => e.aliadoId === selectedAliado)
    }
    if (selectedEstado) {
      result = result.filter((e) => e.estado === selectedEstado)
    }
    return result
  }, [events, selectedDesembolso, selectedAliado, selectedEstado])

  const { groups } = useMapMarkers(filteredEvents, mockCoordenadas)

  const totalMunicipios = groups.length
  const totalEventos = groups.reduce((s, g) => s + g.totalEventos, 0)
  const totalValor = groups.reduce((s, g) => s + g.totalValor, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando mapa...</p>
      </div>
    )
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
        <div className="flex flex-wrap items-center gap-3">
          <select value={selectedDesembolso} onChange={(e) => setSelectedDesembolso(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los desembolsos</option>
            {getDesembolsosSync().map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
          </select>
          <select value={selectedAliado} onChange={(e) => setSelectedAliado(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los aliados</option>
            {getAliadosSync().map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
          </select>
          <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los estados</option>
            <option value="Abierto">Abierto</option>
            <option value="En ejecucion">En ejecución</option>
            <option value="Ejecutado">Ejecutado</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Legalizado">Legalizado</option>
          </select>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 ml-auto">
          <span className="font-medium text-slate-700">Leyenda:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Abierto</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> En ejecución</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> Ejecutado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-500" /> Cerrado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /> Legalizado</span>
        </div>
      </div>

      <div className="h-[600px] rounded-xl overflow-hidden">
        <ExecutionMap groups={groups} />
      </div>
    </div>
  )
}
