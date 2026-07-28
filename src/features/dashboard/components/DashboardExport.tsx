import { Download } from 'lucide-react'
import type { Event, Ally, Disbursement } from '../../../types'

interface DashboardExportProps {
  events: Event[]
  aliados: Ally[]
  desembolsos: Disbursement[]
}

export function DashboardExport({ events, aliados, desembolsos }: DashboardExportProps) {
  async function handleExport() {
    const { utils, writeFile } = await import('xlsx')

    const aliadosMap = Object.fromEntries(aliados.map((a) => [a.id, a.nombre]))
    const desembolsosMap = Object.fromEntries(desembolsos.map((d) => [d.id, d.nombre]))

    const headers = ['Evento', 'Responsable', 'Estado', 'Municipio', 'Aliado', 'Desembolso', 'Ítems', 'Total']
    const data: (string | number)[][] = [headers]

    for (const event of events) {
      const total = event.items.reduce((s, i) => s + i.total, 0)
      data.push([
        `${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`,
        event.responsable,
        event.estado,
        event.municipioId,
        aliadosMap[event.aliadoId] || event.aliadoId,
        desembolsosMap[event.desembolsoId] || event.desembolsoId,
        event.items.length,
        total,
      ])
    }

    const ws = utils.aoa_to_sheet(data)
    ws['!cols'] = [
      { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 16 },
      { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 18 },
    ]

    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Dashboard')
    writeFile(wb, `dashboard_sigev_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
    >
      <Download className="w-4 h-4" />
      Exportar Panel
    </button>
  )
}
