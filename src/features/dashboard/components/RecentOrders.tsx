import { Eye, ArrowUpRight } from 'lucide-react'
import type { Event, Ally, Disbursement } from '../../../types'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import { Link } from 'react-router-dom'

const stateStyles: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  Postulado: { dot: 'bg-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Postulado' },
  'En preparación': { dot: 'bg-blue-500', bg: 'bg-blue-100', text: 'text-blue-800', label: 'En preparación' },
  'En revisión': { dot: 'bg-orange-500', bg: 'bg-orange-100', text: 'text-orange-800', label: 'En revisión' },
  'En ejecución': { dot: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-800', label: 'En ejecución' },
  Cerrado: { dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-800', label: 'Cerrado' },
  Legalizado: { dot: 'bg-purple-500', bg: 'bg-purple-100', text: 'text-purple-800', label: 'Legalizado' },
  Devuelto: { dot: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-800', label: 'Devuelto' },
  Rechazado: { dot: 'bg-rose-500', bg: 'bg-rose-100', text: 'text-rose-800', label: 'Rechazado' },
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
          className="text-xs font-medium text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1"
        >
          Ver todas
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="relative">
        <div className="absolute left-[22px] top-0 bottom-0 w-px bg-slate-200" />
        <div className="divide-y divide-slate-100">
          {recent.map((event) => {
            const total = event.items.reduce((s, i) => s + i.total, 0)
            const s = stateStyles[event.estado] || stateStyles.Postulado
            return (
              <div key={event.id} className="relative px-5 py-3.5 pl-[52px] hover:bg-slate-50 transition-colors group">
                <div className={`absolute left-[17px] top-[18px] w-3 h-3 rounded-full border-2 border-white ${s.dot} shadow-sm`} />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {event.numeroEvento}{event.sufijo ? `-${event.sufijo}` : ''}
                      </span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight ${s.bg} ${s.text}`}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {aliadosMap[event.aliadoId] || event.aliadoId}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {desembolsosMap[event.desembolsoId] || event.desembolsoId} · {formatDateCO(event.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrencyCO(total)}</span>
                    <Link
                      to={`/ordenes/${event.id}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
          {recent.length === 0 && (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No hay órdenes registradas</p>
          )}
        </div>
      </div>
    </div>
  )
}
