import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Offer, OfferExportOptions } from '../types'
import {
  esquemaLabel,
  taxRateLabel,
  aliadoName,
  resolveMunicipio,
  splitNumeroEvento,
  displayItemsForExport,
} from './exportHelpers'
import { formatCurrencyCO } from '../../../utils/formatters'

export function exportOfferToPDF(offer: Offer, options: OfferExportOptions = {}): void {
  const {
    event,
    aliados = [],
    municipios = [],
    rates,
    usuario = '',
    fechaCorte = new Date(),
    filtros = 'Ninguno',
  } = options

  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  const municipio = event ? resolveMunicipio(event.municipioId, municipios) : undefined
  const numSufijo = event ? { numero: event.numeroEvento, sufijo: event.sufijo } : splitNumeroEvento(offer.numeroEvento ?? '')
  const responsable = event?.responsable ?? offer.responsable ?? '—'
  const dependencia = event?.dependencia ?? offer.dependencia ?? '—'
  const aliadoGeneral = event
    ? (aliados.find((a) => a.id === event.aliadoId)?.nombre ?? offer.aliado ?? '—')
    : (offer.aliado ?? '—')
  const desembolso = offer.desembolso || '—'
  const esquema = esquemaLabel(event?.esquema ?? offer.esquema)
  const fechaCorteStr = fechaCorte.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  const { items, totals } = displayItemsForExport(offer, options)

  // Cabecera oficial
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('SIGEV - Sistema de Gestión de Eventos', pageW / 2, 15, { align: 'center' })
  doc.setTextColor(0)

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COMUNICADO DE APROBACIÓN', pageW / 2, 26, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Presupuesto Final del Evento', pageW / 2, 33, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Oferta: ${offer.codigo}`, 14, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(`Estado: ${offer.estado}`, pageW - 14, 42, { align: 'right' })

  // Bloque de identificación
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Identificación del Evento', 14, 52)

  const infoBody = [
    ['Número de evento', numSufijo.numero, 'Sufijo', numSufijo.sufijo || '—'],
    ['Funcionario responsable', responsable, 'Dependencia', dependencia],
    ['Departamento', municipio?.departamento || '—', 'Municipio', municipio?.nombre || offer.municipio || '—'],
    ['Vereda', event?.vereda || '—', 'Esquema de presentación', esquema],
    ['Aliado (operador logístico)', aliadoGeneral, 'Desembolso (bolsa presupuestal)', desembolso],
    ['Cliente', offer.cliente || '—', 'Nombre de la oferta', offer.nombre],
  ]

  autoTable(doc, {
    startY: 56,
    body: infoBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42, textColor: [51, 65, 85] },
      1: { cellWidth: 58 },
      2: { fontStyle: 'bold', cellWidth: 42, textColor: [51, 65, 85] },
      3: { cellWidth: 58 },
    },
  })

  const docWithTable = doc as typeof doc & { lastAutoTable: { finalY: number } }
  let y = docWithTable.lastAutoTable.finalY + 12

  // Detalle de ítems
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle de Ítems Económicos', 14, y)
  y += 4

  const body = items.map((item) => [
    item.descripcion,
    aliadoName(offer, item.aliadoId, aliados),
    String(item.cantidad),
    formatCurrencyCO(item.valorUnitario),
    item.categoriaTributaria,
    taxRateLabel(item, rates),
    formatCurrencyCO(item.base),
    formatCurrencyCO(item.iva > 0 ? item.iva : item.impuestoConsumo),
    formatCurrencyCO(item.feeTarifado + item.feeTerceros),
    formatCurrencyCO(item.ivaFee),
    formatCurrencyCO(item.total),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Aliado', 'Cant.', 'Vr. Unitario', 'Clasif.', 'Tasa', 'Base', 'Impuesto', 'Fee', 'IVA Fee', 'Total']],
    body,
    foot: [
      [
        { content: 'TOTALES', colSpan: 6, styles: { fontStyle: 'bold', fontSize: 9 } },
        '',
        formatCurrencyCO(totals.base),
        formatCurrencyCO(totals.iva + totals.consumo),
        formatCurrencyCO(totals.fee),
        formatCurrencyCO(totals.ivaFee),
        { content: formatCurrencyCO(totals.total), styles: { fontStyle: 'bold', fontSize: 10 } },
      ],
    ],
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
    footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 16 },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'right' },
    },
  })

  y = docWithTable.lastAutoTable.finalY + 12

  // Resumen económico
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen Económico - Totales Consolidados', 14, y)
  y += 4

  const summaryBody = [
    ['Base acumulada', formatCurrencyCO(totals.base)],
    ['Total Impuestos (IVA + Imp. Consumo)', formatCurrencyCO(totals.iva + totals.consumo)],
    ['Fee Técnico Administrativo Total', formatCurrencyCO(totals.fee)],
    ['IVA sobre el Fee', formatCurrencyCO(totals.ivaFee)],
    ['GRAN TOTAL DEL EVENTO', formatCurrencyCO(totals.total)],
  ]

  autoTable(doc, {
    startY: y,
    body: summaryBody,
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'right' },
    },
    bodyStyles: { textColor: [51, 65, 85] },
    didParseCell: (data) => {
      if (data.row.index === summaryBody.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = [16, 185, 129]
      }
    },
  })

  y = docWithTable.lastAutoTable.finalY + 12

  // Pie de aprobación
  doc.setFontSize(9)
  doc.text('Este documento certifica la aprobación y el presupuesto final del evento, listo para entrega al operador logístico.', 14, y, { maxWidth: pageW - 28 })
  y += 7
  doc.text(`Generado por: ${usuario || 'N/A'}`, 14, y)
  doc.text(`Fecha de corte: ${fechaCorteStr}`, pageW - 14, y, { align: 'right' })
  y += 5
  doc.text(`Filtros aplicados: ${filtros}`, 14, y)

  doc.setFontSize(7)
  doc.setTextColor(120)
  doc.text('Documento generado por SIGEV - Sistema de Gestión de Eventos', pageW / 2, 285, { align: 'center' })
  doc.setTextColor(0)

  const safeCodigo = offer.codigo.replace(/[^a-zA-Z0-9_-]/g, '_')
  doc.save(`${safeCodigo}_aprobacion_presupuesto.pdf`)
}
