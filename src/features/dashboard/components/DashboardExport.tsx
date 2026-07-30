import { Download, FileText } from 'lucide-react'
import type { Event, Ally, Disbursement, Municipality } from '../../../types'
import { formatCurrencyCO } from '../../../utils/formatters'

interface DashboardExportProps {
  events: Event[]
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
  metrics: { valorTotalEjecucion: number; numeroEventos: number }
}

export function DashboardExport({ events, aliados, desembolsos, municipios, metrics }: DashboardExportProps) {
  async function handleExportXLSX() {
    const { utils, writeFile } = await import('xlsx')

    const aliadosMap = Object.fromEntries(aliados.map((a) => [a.id, a.nombre]))
    const desembolsosMap = Object.fromEntries(desembolsos.map((d) => [d.id, d.nombre]))
    const municipiosMap = Object.fromEntries(municipios.map((m) => [m.id, m.nombre]))

    const headers = ['Evento', 'Responsable', 'Estado', 'Municipio', 'Aliado', 'Desembolso', 'Ítems', 'Total']
    const data: (string | number)[][] = [headers]

    for (const event of events) {
      const total = event.items.reduce((s, i) => s + i.total, 0)
      data.push([
        `${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`,
        event.responsable,
        event.estado,
        municipiosMap[event.municipioId] || event.municipioId,
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

  async function handleExportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF('landscape')
    const aliadosMap = Object.fromEntries(aliados.map((a) => [a.id, a.nombre]))
    const desembolsosMap = Object.fromEntries(desembolsos.map((d) => [d.id, d.nombre]))
    const municipiosMap = Object.fromEntries(municipios.map((m) => [m.id, m.nombre]))

    doc.setFontSize(16)
    doc.text('Panel de Control - SIGEV', 14, 20)
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 28)
    doc.text(`Eventos: ${metrics.numeroEventos} · Valor Total: ${formatCurrencyCO(metrics.valorTotalEjecucion)}`, 14, 34)

    const headers = ['Evento', 'Responsable', 'Estado', 'Aliado', 'Desembolso', 'Municipio', 'Ítems', 'Total']
    const body: (string | number)[][] = []

    for (const event of events) {
      const total = event.items.reduce((s, i) => s + i.total, 0)
      body.push([
        `${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`,
        event.responsable ?? '',
        event.estado ?? '',
        aliadosMap[event.aliadoId] || event.aliadoId,
        desembolsosMap[event.desembolsoId] || event.desembolsoId,
        municipiosMap[event.municipioId] || event.municipioId,
        event.items.length,
        formatCurrencyCO(total),
      ])
    }

    autoTable(doc, {
      head: [headers],
      body,
      startY: 42,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [51, 65, 85] },
      columnStyles: {
        7: { halign: 'right' },
      },
    })

    doc.save(`dashboard_sigev_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportXLSX}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
      >
        <Download className="w-4 h-4" />
        Excel
      </button>
      <button
        onClick={handleExportPDF}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
      >
        <FileText className="w-4 h-4" />
        PDF
      </button>
    </div>
  )
}
