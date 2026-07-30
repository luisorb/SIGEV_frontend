import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Offer } from '../types'
import { formatCurrencyCO } from '../../../utils/formatters'

export function exportOfferToPDF(offer: Offer): void {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.text('OFERTA ECONÓMICA - SIGEV', pageW / 2, 20, { align: 'center' })

  doc.setFontSize(9)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 30)

  doc.setFontSize(11)
  doc.text('Datos Generales', 14, 42)

  doc.setFontSize(9)
  const leftCol = [
    ['Código:', offer.codigo],
    ['Nombre:', offer.nombre],
    ['Cliente:', offer.cliente],
    ['N° Evento:', offer.numeroEvento || '—'],
  ]
  const rightCol = [
    ['Estado:', offer.estado],
    ['Responsable:', offer.responsable || '—'],
    ['Aliado:', offer.aliado || '—'],
    ['Desembolso:', offer.desembolso || '—'],
  ]

  let y = 50
  for (let i = 0; i < leftCol.length; i++) {
    doc.text(leftCol[i][0], 14, y + i * 5)
    doc.text(leftCol[i][1], 55, y + i * 5)
    doc.text(rightCol[i][0], 120, y + i * 5)
    doc.text(rightCol[i][1], 170, y + i * 5)
  }

  y += leftCol.length * 5 + 10

  const body = offer.items.map((item) => [
    item.descripcion,
    String(item.cantidad),
    formatCurrencyCO(item.valorUnitario),
    item.categoriaTributaria,
    formatCurrencyCO(item.base),
    formatCurrencyCO(item.iva || item.impuestoConsumo),
    formatCurrencyCO(item.feeTarifado + item.feeTerceros),
    formatCurrencyCO(item.ivaFee),
    formatCurrencyCO(item.total),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cant.', 'Vr. Unitario', 'Cat.', 'Base', 'Impuesto', 'Fee', 'IVA Fee', 'Total']],
    body,
    foot: [
      [
        { content: 'TOTALES', colSpan: 4, styles: { fontStyle: 'bold', fontSize: 9 } },
        '',
        formatCurrencyCO(offer.subtotal),
        formatCurrencyCO(offer.ivaTotal + offer.impuestoConsumoTotal),
        formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal),
        formatCurrencyCO(offer.ivaFeeTotal),
        { content: formatCurrencyCO(offer.total), styles: { fontStyle: 'bold', fontSize: 10 } },
      ],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [51, 65, 85] },
    footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 50 },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
  })

  const docWithTable = doc as typeof doc & { lastAutoTable: { finalY: number } }
  y = docWithTable.lastAutoTable.finalY + 15

  doc.setFontSize(11)
  doc.text('Resumen Económico', 14, y)
  y += 8

  const summaryBody = [
    ['Base gravable', formatCurrencyCO(offer.subtotal)],
    ['IVA (19%)', formatCurrencyCO(offer.ivaTotal)],
    ['Impuesto al Consumo (8%)', formatCurrencyCO(offer.impuestoConsumoTotal)],
    ['Fee Técnico Administrativo (8.25%)', formatCurrencyCO(offer.feeTarifadoTotal)],
    ['Fee Terceros', formatCurrencyCO(offer.feeTercerosTotal)],
    ['IVA del Fee (19%)', formatCurrencyCO(offer.ivaFeeTotal)],
    ['TOTAL OFERTA', formatCurrencyCO(offer.total)],
  ]

  autoTable(doc, {
    startY: y,
    body: summaryBody,
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'right' },
    },
    bodyStyles: { textColor: [51, 65, 85] },
  })

  y = docWithTable.lastAutoTable.finalY + 15

  doc.setFontSize(7)
  doc.text('Documento generado por SIGEV - Sistema de Gestión de Eventos', pageW / 2, y, { align: 'center' })
  doc.text(`Usuario: ${offer.responsable || 'N/A'} · Fecha: ${new Date().toLocaleString('es-CO')}`, pageW / 2, y + 4, { align: 'center' })

  doc.save(`${offer.codigo.replace(/[^a-zA-Z0-9_-]/g, '_')}_oferta_economica.pdf`)
}
