import { CalendarRange } from 'lucide-react'
import { useToast } from '../../../components/ToastProvider'
import { EventosTab } from '../components/EventosTab'

export function EventosPage() {
  const toast = useToast()

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <CalendarRange className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Gestión de Eventos</h1>
        </div>
        <p className="text-sm text-slate-500">Catálogo de los tipos de evento que se registran en el sistema</p>
      </div>
      <div className="min-h-0 flex-1">
        <EventosTab showToast={toast.showToast} />
      </div>
    </div>
  )
}