import { useMemo } from 'react'
import { KanbanBoard } from '../components/KanbanBoard'
import { useKanban } from '../hooks/useKanban'
import { mockEvents, mockAliados, mockMunicipios } from '../../events/utils/mockData'

export function KanbanPage() {
  const {
    grouped,
    counts,
    pendingChange,
    handleDragEnd,
    confirmStateChange,
    cancelStateChange,
  } = useKanban({ events: mockEvents })

  const aliadosMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const a of mockAliados) m[a.id] = a.nombre
    return m
  }, [])

  const municipiosMap = useMemo(() => {
    const m: Record<string, string> = {}
    for (const mun of mockMunicipios) m[mun.id] = `${mun.nombre} (${mun.departamento})`
    return m
  }, [])

  const totalEventos = Object.values(counts).reduce((s, c) => s + c, 0)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tablero Kanban</h1>
          <p className="text-sm text-slate-500">
            {totalEventos} eventos en total · Arrastra las tarjetas para cambiar su estado
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {Object.entries(counts).map(([estado, count]) => (
            <div key={estado} className="text-center">
              <p className="text-lg font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">{estado}</p>
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
