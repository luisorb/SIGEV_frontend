import { Download, FileText } from 'lucide-react'
import type { Event, Ally, Disbursement, Municipality } from '../../../types'
import type { ConsolidadoRow, CoberturaItem, DashboardFiltersState, DashboardMetrics } from '../types'
import { formatCurrencyCO, formatDateCO, formatDateTimeCO, formatPercentage } from '../../../utils/formatters'
import type { jsPDF } from 'jspdf'
import type { CellInput, Styles, UserOptions } from 'jspdf-autotable'

interface DashboardExportProps {
  events: Event[]
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
  metrics: DashboardMetrics
  consolidadoDesembolso: ConsolidadoRow[]
  consolidadoAliado: ConsolidadoRow[]
  coberturaTerritorial: CoberturaItem[]
  filters: DashboardFiltersState
  hasActiveFilters: boolean
}

const PAGE_MARGIN = 14

const TEXT_DARK: [number, number, number] = [15, 23, 42]
const TEXT_MUTED: [number, number, number] = [71, 85, 105]
const TEXT_FAINT: [number, number, number] = [100, 116, 139]
const LINE_COLOR: [number, number, number] = [226, 232, 240]
const HEAD_FILL: [number, number, number] = [241, 245, 249]

interface TableSpec {
  head?: string[]
  body: (string | number)[][]
  foot?: CellInput[][]
  columnStyles?: Record<string, Partial<Styles>>
  startY: number
  fontSize?: number
}

type AutoTableFn = (doc: jsPDF, options: UserOptions) => void

function getLastTableY(doc: jsPDF, fallback: number): number {
  const last = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
  return last?.finalY ?? fallback
}

function renderTable(doc: jsPDF, spec: TableSpec, autoTable: AutoTableFn): number {
  const options: UserOptions = {
    startY: spec.startY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: 18, bottom: 18 },
    body: spec.body,
    theme: 'grid',
    showHead: 'everyPage',
    showFoot: 'lastPage',
    styles: {
      fontSize: spec.fontSize ?? 8.5,
      cellPadding: 3,
      fillColor: false,
      textColor: TEXT_MUTED,
      lineColor: LINE_COLOR,
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: HEAD_FILL,
      textColor: TEXT_DARK,
      fontStyle: 'bold',
      fontSize: 8.5,
      valign: 'middle',
    },
    footStyles: {
      fillColor: HEAD_FILL,
      textColor: TEXT_DARK,
      fontStyle: 'bold',
    },
    columnStyles: spec.columnStyles,
  }
  if (spec.head?.length) options.head = [spec.head]
  if (spec.foot?.length) options.foot = spec.foot
  autoTable(doc, options)
  return getLastTableY(doc, spec.startY)
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, pageWidth: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_DARK)
  doc.text(title, PAGE_MARGIN, y)
  doc.setDrawColor(...LINE_COLOR)
  doc.setLineWidth(0.3)
  doc.line(PAGE_MARGIN, y + 2.2, pageWidth - PAGE_MARGIN, y + 2.2)
  return y + 7
}

function ensureSpace(doc: jsPDF, y: number, pageHeight: number, estimatedRows: number, fontSize = 8.5): number {
  const rowHeight = (fontSize / 2.8346) * 1.15 + 6
  const needed = 7 + (estimatedRows + 1) * rowHeight + 4
  if (y + needed > pageHeight - 18) {
    doc.addPage()
    return 24
  }
  return y
}

function drawPageChrome(doc: jsPDF, pageWidth: number, pageHeight: number, generatedAt: string) {
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    if (i > 1) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...TEXT_DARK)
      doc.text('Panel de Control · SIGEV', PAGE_MARGIN, 11)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_FAINT)
      doc.text('Reporte de ejecución de eventos', PAGE_MARGIN, 15)
      doc.text(`Generado: ${generatedAt}`, pageWidth - PAGE_MARGIN, 11, { align: 'right' })
      doc.setDrawColor(...LINE_COLOR)
      doc.setLineWidth(0.3)
      doc.line(PAGE_MARGIN, 17, pageWidth - PAGE_MARGIN, 17)
    }

    const y = pageHeight - 9
    doc.setDrawColor(...LINE_COLOR)
    doc.setLineWidth(0.3)
    doc.line(PAGE_MARGIN, y - 4, pageWidth - PAGE_MARGIN, y - 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_FAINT)
    doc.text('SIGEV', PAGE_MARGIN, y)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - PAGE_MARGIN, y, { align: 'right' })
  }
}

export function DashboardExport({
  events,
  aliados,
  desembolsos,
  municipios,
  metrics,
  consolidadoDesembolso,
  consolidadoAliado,
  coberturaTerritorial,
  filters,
  hasActiveFilters,
}: DashboardExportProps) {
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

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - PAGE_MARGIN * 2

    const aliadosMap = Object.fromEntries(aliados.map((a) => [a.id, a.nombre]))
    const desembolsosMap = Object.fromEntries(desembolsos.map((d) => [d.id, d.nombre]))
    const municipiosMap = Object.fromEntries(municipios.map((m) => [m.id, m.nombre]))

    const generatedAt = formatDateTimeCO(new Date())

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_FAINT)
    doc.text('SIGEV', PAGE_MARGIN, 16)
    doc.setFontSize(8.5)
    doc.text(`Generado: ${generatedAt}`, pageWidth - PAGE_MARGIN, 16, { align: 'right' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(21)
    doc.setTextColor(...TEXT_DARK)
    doc.text('Panel de Control', PAGE_MARGIN, 30)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_MUTED)
    doc.text('Reporte de ejecución de eventos', PAGE_MARGIN, 36)

    doc.setFontSize(9)
    doc.setTextColor(...TEXT_FAINT)
    doc.text(`${metrics.numeroEventos} evento(s) en ejecución`, pageWidth - PAGE_MARGIN, 34, { align: 'right' })

    doc.setDrawColor(...TEXT_DARK)
    doc.setLineWidth(0.9)
    doc.line(PAGE_MARGIN, 42, pageWidth - PAGE_MARGIN, 42)
    doc.setDrawColor(...LINE_COLOR)
    doc.setLineWidth(0.3)
    doc.line(PAGE_MARGIN, 43.4, pageWidth - PAGE_MARGIN, 43.4)

    let y = 50

    y = drawSectionTitle(doc, 'Resumen de indicadores', y, pageWidth)

    const kpis = [
      { label: 'Valor total ejecución', value: formatCurrencyCO(metrics.valorTotalEjecucion) },
      { label: 'Base + impuestos', value: formatCurrencyCO(metrics.baseMasImpuestos) },
      { label: 'Fee técnico administrativo', value: formatCurrencyCO(metrics.feeAcumulado) },
      { label: 'Impuestos acumulados', value: formatCurrencyCO(metrics.impuestosAcumulados) },
    ]

    const summaryTop = y
    const summaryHeight = 26
    const columnWidth = contentWidth / kpis.length

    doc.setDrawColor(...LINE_COLOR)
    doc.setLineWidth(0.3)
    doc.roundedRect(PAGE_MARGIN, summaryTop, contentWidth, summaryHeight, 2, 2, 'S')

    for (let i = 1; i < kpis.length; i++) {
      const dividerX = PAGE_MARGIN + i * columnWidth
      doc.setDrawColor(...LINE_COLOR)
      doc.setLineWidth(0.3)
      doc.line(dividerX, summaryTop + 1.5, dividerX, summaryTop + summaryHeight - 1.5)
    }

    kpis.forEach((kpi, i) => {
      const columnX = PAGE_MARGIN + i * columnWidth
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(...TEXT_FAINT)
      doc.text(kpi.label.toUpperCase(), columnX + 6, summaryTop + 9, { charSpace: 0.3 })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(...TEXT_DARK)
      const valueLines = doc.splitTextToSize(kpi.value, columnWidth - 14)
      doc.text(valueLines, columnX + 6, summaryTop + 16.5)
    })

    y = summaryTop + summaryHeight + 10

    if (hasActiveFilters) {
      const filterRows: (string)[][] = []
      if (filters.periodoInicio) filterRows.push(['Periodo inicial', formatDateCO(filters.periodoInicio)])
      if (filters.periodoFin) filterRows.push(['Periodo final', formatDateCO(filters.periodoFin)])
      if (filters.desembolsoId)
        filterRows.push(['Desembolso', desembolsosMap[filters.desembolsoId] || filters.desembolsoId])
      if (filters.aliadoId)
        filterRows.push(['Aliado', aliadosMap[filters.aliadoId] || filters.aliadoId])
      if (filters.estado) filterRows.push(['Estado', filters.estado])
      if (filters.municipioId)
        filterRows.push(['Municipio', municipiosMap[filters.municipioId] || filters.municipioId])
      if (filters.dependencia) filterRows.push(['Dependencia', filters.dependencia])

      y = ensureSpace(doc, y, pageHeight, filterRows.length)
      y = drawSectionTitle(doc, 'Filtros aplicados', y, pageWidth)
      y = renderTable(doc, {
        startY: y,
        head: ['Criterio', 'Valor'],
        body: filterRows,
        columnStyles: { 0: { fontStyle: 'bold' } },
      }, autoTable) + 10
    }

    if (consolidadoDesembolso.length > 0) {
      y = ensureSpace(doc, y, pageHeight, consolidadoDesembolso.length)
      y = drawSectionTitle(doc, '1. Ejecución por Desembolso', y, pageWidth)
      y = renderTable(doc, {
        startY: y,
        head: ['Desembolso', 'Eventos', 'Valor Total', 'Fee Total', 'Participación'],
        body: consolidadoDesembolso.map((row) => [
          row.nombre,
          row.cantidadEventos,
          formatCurrencyCO(row.valorTotal),
          formatCurrencyCO(row.feeTotal),
          formatPercentage(row.porcentaje),
        ]),
        columnStyles: { 0: { fontStyle: 'bold' } },
      }, autoTable) + 10
    }

    if (consolidadoAliado.length > 0) {
      y = ensureSpace(doc, y, pageHeight, consolidadoAliado.length)
      y = drawSectionTitle(doc, '2. Ejecución por Aliado', y, pageWidth)
      y = renderTable(doc, {
        startY: y,
        head: ['Aliado', 'Eventos', 'Valor Total', 'Fee Total', 'Participación'],
        body: consolidadoAliado.map((row) => [
          row.nombre,
          row.cantidadEventos,
          formatCurrencyCO(row.valorTotal),
          formatCurrencyCO(row.feeTotal),
          formatPercentage(row.porcentaje),
        ]),
        columnStyles: { 0: { fontStyle: 'bold' } },
      }, autoTable) + 10
    }

    if (coberturaTerritorial.length > 0) {
      y = ensureSpace(doc, y, pageHeight, coberturaTerritorial.length)
      y = drawSectionTitle(doc, '3. Cobertura Territorial', y, pageWidth)
      y = renderTable(doc, {
        startY: y,
        head: ['Municipio', 'Departamento', 'Eventos', 'Valor Total', 'Participación'],
        body: coberturaTerritorial.map((row) => [
          row.municipio,
          row.departamento || '-',
          row.cantidadEventos,
          formatCurrencyCO(row.valorTotal),
          formatPercentage(row.porcentaje),
        ]),
        columnStyles: { 0: { fontStyle: 'bold' } },
      }, autoTable) + 10
    }

    y = ensureSpace(doc, y, pageHeight, 3)
    y = drawSectionTitle(doc, '4. Detalle de Eventos', y, pageWidth)

    if (events.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...TEXT_FAINT)
      doc.text('No hay eventos para el período y filtros seleccionados.', PAGE_MARGIN, y)
    } else {
      const detailBody = events.map((event) => {
        const total = event.items.reduce((s, i) => s + i.total, 0)
        return [
          `${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`,
          event.responsable ?? '-',
          event.estado ?? '-',
          aliadosMap[event.aliadoId] || event.aliadoId,
          desembolsosMap[event.desembolsoId] || event.desembolsoId,
          municipiosMap[event.municipioId] || event.municipioId,
          event.items.length,
          formatCurrencyCO(total),
        ]
      })

      const totalItems = events.reduce((s, e) => s + e.items.length, 0)
      const totalValor = events.reduce((s, e) => s + e.items.reduce((a, i) => a + i.total, 0), 0)

      renderTable(doc, {
        startY: y,
        head: ['Evento', 'Responsable', 'Estado', 'Aliado', 'Desembolso', 'Municipio', 'Ítems', 'Total'],
        body: detailBody,
        foot: [
          [
            { content: 'Total', colSpan: 6, styles: { halign: 'left' } },
            totalItems,
            formatCurrencyCO(totalValor),
          ],
        ],
        fontSize: 8,
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 34 },
          2: { cellWidth: 26 },
          3: { cellWidth: 42 },
          4: { cellWidth: 42 },
          5: { cellWidth: 30 },
          6: { cellWidth: 16 },
          7: { cellWidth: 47 },
        },
      }, autoTable)
    }

    drawPageChrome(doc, pageWidth, pageHeight, generatedAt)
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
