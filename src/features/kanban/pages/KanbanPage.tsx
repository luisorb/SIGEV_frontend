import { useMemo } from 'react'
import { KanbanBoard } from '../components/KanbanBoard'
import { useKanban } from '../hooks/useKanban'
import { useQuery } from '@tanstack/react-query'
import { getEventsApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useMunicipalities } from '../../../hooks/useMunicipalities'

export function KanbanPage() {
  const { data: events = [], isLoading } = useQuery({ queryKey: ['events'], queryFn: getEventsApi })
  const { data: aliados = [] } = useAllies({ all: true })
  const { data: municipios = [] } = useMunicipalities()

  const {
    grouped,
    counts,
    pendingChange,
    handleDragEnd,
    confirmStateChange,
    cancelStateChange,
  } = useKanban({ events })

  const aliadosMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const a of aliados) m[a.id] = a.nombre
    return m
  }, [aliados])

  const municipiosMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const mun of municipios) m[mun.id] = `${mun.nombre} (${mun.departamento})`
    return m
  }, [municipios])

  function formatCompactCO(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value}`
  }

  const columnTotals = useMemo(() => {
    const result: Record<string, number> = {}
    for (const col of Object.keys(grouped)) {
      result[col] = grouped[col].reduce((s, c) => s + c.totalEconomico, 0)
    }
    return result
  }, [grouped])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Cargando tablero...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4 shrink-0 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tablero Kanban</h1>
          <p className="text-sm text-slate-500">
            Visualiza el flujo de los eventos por estado y cambia su estado arrastrando las tarjetas entre columnas.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {Object.entries(counts).map(([estado, count]) => (
            <div key={estado} className="text-center px-2 py-1 rounded-lg bg-white border border-slate-200 min-w-20">
              <p className="text-base font-bold text-slate-900 leading-tight">{count}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{estado}</p>
              <p className="text-[10px] font-medium text-slate-600">{formatCompactCO(columnTotals[estado] ?? 0)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          grouped={grouped}
          counts={counts}
          aliadosMap={aliadosMap}
          municipiosMap={municipiosMap}
          onDragEnd={handleDragEnd}
          pendingChange={pendingChange}
          onConfirmChange={confirmStateChange}
          onCancelChange={cancelStateChange}
        />
      </div>
    </div>
  )
}
