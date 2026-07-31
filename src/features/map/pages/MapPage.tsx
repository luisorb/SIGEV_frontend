import { useMemo, useState } from 'react'
import { useMapMarkers } from '../hooks/useMapMarkers'
import { ExecutionMap } from '../components/ExecutionMap'
import { useQuery } from '@tanstack/react-query'
import { getEventsApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useDisbursements } from '../../../hooks/useDisbursements'
import { formatCurrencyCO } from '../../../utils/formatters'

export function MapPage() {
  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: getEventsApi })
  const { data: aliados = [] } = useAllies()
  const { data: desembolsos = [] } = useDisbursements()

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

  const { groups } = useMapMarkers(filteredEvents, [])

  const totalMunicipios = groups.length
  const totalEventos = groups.reduce((s, g) => s + g.totalEventos, 0)
  const totalValor = groups.reduce((s, g) => s + g.totalValor, 0)

  if (isLoading) {
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
            {desembolsos.map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
          </select>
          <select value={selectedAliado} onChange={(e) => setSelectedAliado(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los aliados</option>
            {aliados.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
          </select>
          <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
            <option value="">Todos los estados</option>
            <option value="Postulado">Postulado</option>
            <option value="En preparación">En preparación</option>
            <option value="En revisión">En revisión</option>
            <option value="En ejecución">En ejecución</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Legalizado">Legalizado</option>
            <option value="Devuelto">Devuelto</option>
            <option value="Rechazado">Rechazado</option>
          </select>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500 ml-auto">
          <span className="font-medium text-slate-700">Leyenda:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500" /> Postulado</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> En preparación</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500" /> En revisión</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> En ejecución</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Devuelto</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500" /> Legalizado</span>
        </div>
      </div>

      <div className="h-[600px] rounded-xl overflow-hidden">
        <ExecutionMap groups={groups} />
      </div>
    </div>
  )
}
