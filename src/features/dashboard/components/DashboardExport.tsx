import { FileSpreadsheet, FileText } from 'lucide-react'
import type { Event, Ally, Disbursement, Municipality } from '../../../types'
import type { ConsolidadoRow, CoberturaItem, DashboardFiltersState, DashboardMetrics } from '../types'
import { formatCurrencyCO, formatDateCO, formatDateTimeCO, formatPercentage } from '../../../utils/formatters'
import type { jsPDF } from 'jspdf'
import type { CellInput, Styles, UserOptions } from 'jspdf-autotable'
import type { WorkBook, WorkSheet } from 'xlsx'

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

const CURRENCY_FMT = '"$"#,##0.00'
const PERCENT_FMT = '0.00%'
const INT_FMT = '#,##0'

type ExportFormat = 'currency' | 'percent' | 'number'

interface ExportColumn {
  header: string
  wch: number
  fmt?: ExportFormat
}

interface ExportFilterRow {
  label: string
  value: string
}

interface ExportSheetSpec {
  name: string
  title: string
  meta?: string[]
  columns: ExportColumn[]
  rows: (string | number)[][]
  foot?: (string | number | null)[]
  footSpan?: number
  filters?: ExportFilterRow[]
  autofilter?: boolean
}

interface SheetBuilderUtils {
  aoa_to_sheet(data: (string | number | null)[][]): WorkSheet
  encode_cell(cell: { r: number; c: number }): string
  encode_range(range: { s: { r: number; c: number }; e: { r: number; c: number } }): string
}

function buildSheet(utils: SheetBuilderUtils, spec: ExportSheetSpec): WorkSheet {
  const { columns, rows } = spec
  const aoa: (string | number | null)[][] = [[spec.title]]
  spec.meta?.forEach((line) => aoa.push([line]))
  aoa.push([])
  if (spec.filters?.length) {
    aoa.push(['Filtros aplicados'])
    spec.filters.forEach((f) => aoa.push([f.label, f.value]))
    aoa.push([])
  }
  aoa.push(columns.map((c) => c.header))
  rows.forEach((r) => aoa.push(r))
  if (spec.foot) aoa.push(spec.foot)

  const ws = utils.aoa_to_sheet(aoa)
  const lastCol = columns.length - 1
  const headerRow = aoa.length - 1 - rows.length - (spec.foot ? 1 : 0)

  const merges: NonNullable<WorkSheet['!merges']> = []
  merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } })
  spec.meta?.forEach((_, i) => merges.push({ s: { r: i + 1, c: 0 }, e: { r: i + 1, c: lastCol } }))
  if (spec.filters?.length) {
    merges.push({
      s: { r: headerRow - spec.filters.length - 2, c: 0 },
      e: { r: headerRow - spec.filters.length - 2, c: lastCol },
    })
  }
  if (spec.foot && (spec.footSpan ?? 1) > 1) {
    const footRow = aoa.length - 1
    merges.push({ s: { r: footRow, c: 0 }, e: { r: footRow, c: (spec.footSpan ?? 1) - 1 } })
  }
  ws['!merges'] = merges

  ws['!cols'] = columns.map((c) => ({ wch: c.wch }))

  const rowHeights: { hpt: number }[] = []
  let idx = 0
  rowHeights[idx++] = { hpt: 22 }
  spec.meta?.forEach(() => {
    rowHeights[idx++] = { hpt: 14 }
  })
  rowHeights[idx++] = { hpt: 6 }
  if (spec.filters?.length) {
    rowHeights[idx++] = { hpt: 14 }
    spec.filters.forEach(() => {
      rowHeights[idx++] = { hpt: 14 }
    })
    rowHeights[idx++] = { hpt: 6 }
  }
  rowHeights[idx++] = { hpt: 18 }
  rows.forEach(() => {
    rowHeights[idx++] = { hpt: 16 }
  })
  if (spec.foot) rowHeights[idx++] = { hpt: 18 }
  ws['!rows'] = rowHeights

  const applyFormats = (rowIndex: number) => {
    columns.forEach((col, c) => {
      if (!col.fmt) return
      const cell = ws[utils.encode_cell({ r: rowIndex, c })]
      if (cell && typeof cell.v === 'number') {
        cell.z = col.fmt === 'currency' ? CURRENCY_FMT : col.fmt === 'percent' ? PERCENT_FMT : INT_FMT
      }
    })
  }
  for (let r = headerRow + 1; r < aoa.length; r++) applyFormats(r)

  if (spec.autofilter && rows.length > 0) {
    ws['!autofilter'] = {
      ref: utils.encode_range({
        s: { r: headerRow, c: 0 },
        e: { r: headerRow + rows.length - 1, c: lastCol },
      }),
    }
  }

  return ws
}

function buildMaps(aliados: Ally[], desembolsos: Disbursement[], municipios: Municipality[]) {
  return {
    aliados: Object.fromEntries(aliados.map((a) => [a.id, a.nombre])),
    desembolsos: Object.fromEntries(desembolsos.map((d) => [d.id, d.nombre])),
    municipios: Object.fromEntries(municipios.map((m) => [m.id, m.nombre])),
  }
}

function buildFilterRows(
  filters: DashboardFiltersState,
  maps: ReturnType<typeof buildMaps>,
): ExportFilterRow[] {
  const rows: ExportFilterRow[] = []
  if (filters.periodoInicio) rows.push({ label: 'Periodo inicial', value: formatDateCO(filters.periodoInicio) })
  if (filters.periodoFin) rows.push({ label: 'Periodo final', value: formatDateCO(filters.periodoFin) })
  if (filters.desembolsoId) rows.push({ label: 'Desembolso', value: maps.desembolsos[filters.desembolsoId] || filters.desembolsoId })
  if (filters.aliadoId) rows.push({ label: 'Aliado', value: maps.aliados[filters.aliadoId] || filters.aliadoId })
  if (filters.estado) rows.push({ label: 'Estado', value: filters.estado })
  if (filters.municipioId) rows.push({ label: 'Municipio', value: maps.municipios[filters.municipioId] || filters.municipioId })
  if (filters.dependencia) rows.push({ label: 'Dependencia', value: filters.dependencia })
  return rows
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

    const maps = buildMaps(aliados, desembolsos, municipios)
    const generatedAt = formatDateTimeCO(new Date())
    const filterRows = hasActiveFilters ? buildFilterRows(filters, maps) : undefined

    const wb: WorkBook = utils.book_new()

    utils.book_append_sheet(
      wb,
      buildSheet(utils, {
        name: 'Resumen',
        title: 'Panel de Control · SIGEV',
        meta: [
          `Reporte de ejecución de eventos · ${metrics.numeroEventos} evento(s) en ejecución`,
          `Generado: ${generatedAt}`,
        ],
        columns: [
          { header: 'Indicador', wch: 34 },
          { header: 'Valor', wch: 26, fmt: 'currency' },
        ],
        rows: [
          ['Valor Total Ejecución', metrics.valorTotalEjecucion],
          ['Base + Impuestos', metrics.baseMasImpuestos],
          ['Fee Técnico Administrativo', metrics.feeAcumulado],
          ['Impuestos Acumulados', metrics.impuestosAcumulados],
        ],
        filters: filterRows,
      }),
      'Resumen',
    )

    if (consolidadoDesembolso.length > 0) {
      utils.book_append_sheet(
        wb,
        buildSheet(utils, {
          name: 'Por Desembolso',
          title: '1. Ejecución por Desembolso',
          columns: [
            { header: 'Desembolso', wch: 30 },
            { header: 'Eventos', wch: 10, fmt: 'number' },
            { header: 'Valor Total', wch: 20, fmt: 'currency' },
            { header: 'Fee Total', wch: 18, fmt: 'currency' },
            { header: 'Participación', wch: 14, fmt: 'percent' },
          ],
          rows: consolidadoDesembolso.map((row) => [
            row.nombre,
            row.cantidadEventos,
            row.valorTotal,
            row.feeTotal,
            row.porcentaje,
          ]),
          foot: [
            'Total',
            consolidadoDesembolso.reduce((s, r) => s + r.cantidadEventos, 0),
            consolidadoDesembolso.reduce((s, r) => s + r.valorTotal, 0),
            consolidadoDesembolso.reduce((s, r) => s + r.feeTotal, 0),
            1,
          ],
          autofilter: true,
        }),
        'Por Desembolso',
      )
    }

    if (consolidadoAliado.length > 0) {
      utils.book_append_sheet(
        wb,
        buildSheet(utils, {
          name: 'Por Aliado',
          title: '2. Ejecución por Aliado',
          columns: [
            { header: 'Aliado', wch: 30 },
            { header: 'Eventos', wch: 10, fmt: 'number' },
            { header: 'Valor Total', wch: 20, fmt: 'currency' },
            { header: 'Fee Total', wch: 18, fmt: 'currency' },
            { header: 'Participación', wch: 14, fmt: 'percent' },
          ],
          rows: consolidadoAliado.map((row) => [
            row.nombre,
            row.cantidadEventos,
            row.valorTotal,
            row.feeTotal,
            row.porcentaje,
          ]),
          foot: [
            'Total',
            consolidadoAliado.reduce((s, r) => s + r.cantidadEventos, 0),
            consolidadoAliado.reduce((s, r) => s + r.valorTotal, 0),
            consolidadoAliado.reduce((s, r) => s + r.feeTotal, 0),
            1,
          ],
          autofilter: true,
        }),
        'Por Aliado',
      )
    }

    if (coberturaTerritorial.length > 0) {
      utils.book_append_sheet(
        wb,
        buildSheet(utils, {
          name: 'Cobertura',
          title: '3. Cobertura Territorial',
          columns: [
            { header: 'Municipio', wch: 24 },
            { header: 'Departamento', wch: 22 },
            { header: 'Eventos', wch: 10, fmt: 'number' },
            { header: 'Valor Total', wch: 20, fmt: 'currency' },
            { header: 'Participación', wch: 14, fmt: 'percent' },
          ],
          rows: coberturaTerritorial.map((row) => [
            row.municipio,
            row.departamento || '-',
            row.cantidadEventos,
            row.valorTotal,
            row.porcentaje,
          ]),
          foot: [
            'Total',
            null,
            coberturaTerritorial.reduce((s, r) => s + r.cantidadEventos, 0),
            coberturaTerritorial.reduce((s, r) => s + r.valorTotal, 0),
            1,
          ],
          autofilter: true,
        }),
        'Cobertura',
      )
    }

    const detailRows = events.map((event) => {
      const total = event.items.reduce((s, i) => s + i.total, 0)
      return [
        `${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`,
        event.responsable ?? '-',
        event.estado ?? '-',
        maps.aliados[event.aliadoId] || event.aliadoId,
        maps.desembolsos[event.desembolsoId] || event.desembolsoId,
        maps.municipios[event.municipioId] || event.municipioId,
        event.items.length,
        total,
      ]
    })

    const totalItems = events.reduce((s, e) => s + e.items.length, 0)
    const totalValor = events.reduce((s, e) => s + e.items.reduce((a, i) => a + i.total, 0), 0)

    utils.book_append_sheet(
      wb,
      buildSheet(utils, {
        name: 'Detalle de Eventos',
        title: '4. Detalle de Eventos',
        columns: [
          { header: 'Evento', wch: 18 },
          { header: 'Responsable', wch: 20 },
          { header: 'Estado', wch: 14 },
          { header: 'Aliado', wch: 22 },
          { header: 'Desembolso', wch: 22 },
          { header: 'Municipio', wch: 18 },
          { header: 'Ítems', wch: 8, fmt: 'number' },
          { header: 'Total', wch: 18, fmt: 'currency' },
        ],
        rows: detailRows,
        foot: ['Total', null, null, null, null, null, totalItems, totalValor],
        footSpan: 6,
        autofilter: true,
      }),
      'Detalle de Eventos',
    )

    writeFile(wb, `dashboard_sigev_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  async function handleExportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - PAGE_MARGIN * 2

    const maps = buildMaps(aliados, desembolsos, municipios)
    const { aliados: aliadosMap, desembolsos: desembolsosMap, municipios: municipiosMap } = maps

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
      const filterRows = buildFilterRows(filters, maps)

      y = ensureSpace(doc, y, pageHeight, filterRows.length)
      y = drawSectionTitle(doc, 'Filtros aplicados', y, pageWidth)
      y = renderTable(doc, {
        startY: y,
        head: ['Criterio', 'Valor'],
        body: filterRows.map((f) => [f.label, f.value]),
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
        title="Descargar el panel de control en formato Excel (.xlsx) para analizar los datos en tu hoja de cálculo"
        className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-150"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Excel
      </button>
      <button
        onClick={handleExportPDF}
        title="Descargar el panel de control en formato PDF listo para imprimir o compartir"
        className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-150"
      >
        <FileText className="w-4 h-4" />
        PDF
      </button>
    </div>
  )
}
