import { Eye } from 'lucide-react'
import type { Event, Ally, Disbursement } from '../../../types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { Link } from 'react-router-dom'

const stateColors: Record<string, string> = {
  Abierto: 'bg-yellow-100 text-yellow-800',
  'En ejecucion': 'bg-blue-100 text-blue-800',
  Ejecutado: 'bg-green-100 text-green-800',
  Cerrado: 'bg-slate-100 text-slate-800',
  Legalizado: 'bg-purple-100 text-purple-800',
}

interface RecentOrdersProps {
  events: Event[]
  aliados: Ally[]
  desembolsos: Disbursement[]
}

export function RecentOrders({ events, aliados, desembolsos }: RecentOrdersProps) {
  const recent = [...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const aliadosMap = Object.fromEntries(aliados.map((a) => [a.id, a.nombre]))
  const desembolsosMap = Object.fromEntries(desembolsos.map((d) => [d.id, d.nombre]))

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Órdenes Recientes</h3>
        <Link
          to="/ordenes"
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Ver todas
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {recent.map((event) => {
          const total = event.items.reduce((s, i) => s + i.total, 0)
          return (
            <div key={event.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">
                    {event.numeroEvento}{event.sufijo ? `-${event.sufijo}` : ''}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${stateColors[event.estado] || ''}`}>
                    {event.estado}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {aliadosMap[event.aliadoId] || event.aliadoId} · {desembolsosMap[event.desembolsoId] || event.desembolsoId} · {formatDateCO(event.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-semibold text-slate-900">{formatCurrencyCO(total)}</span>
                <Link
                  to="/ordenes"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })}
        {recent.length === 0 && (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">No hay órdenes registradas</p>
        )}
      </div>
    </div>
  )
}
