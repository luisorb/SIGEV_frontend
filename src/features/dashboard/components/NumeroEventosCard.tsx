import { ClipboardList } from 'lucide-react'

interface NumeroEventosCardProps {
  count: number
  totalRegistrados: number
}

export function NumeroEventosCard({ count }: NumeroEventosCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 border-l-[3px] border-l-red-500 p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-tight block">
            N&uacute;mero de Eventos Aprobados
          </span>
          <p className="text-xl font-bold tracking-tight mt-1.5 tabular-nums text-slate-900">
            {count}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-red-500" />
        </div>
      </div>
    </div>
  )
}
