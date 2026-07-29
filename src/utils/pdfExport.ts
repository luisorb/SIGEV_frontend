import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Event } from '../types'
import type { Offer } from '../features/offers/types'
import { formatCurrencyCO, formatDateTimeCO } from './formatters'

export function exportBudgetPDF(event: Event, offer: Offer) {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.text('SIGEV - Presupuesto Final', pageW / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.text(`Fecha: ${formatDateTimeCO(new Date().toISOString())}`, 14, 30)

  doc.setFontSize(12)
  doc.text('Datos del Evento', 14, 42)

  doc.setFontSize(9)
  const leftCol = [
    ['Evento:', event.numeroEvento],
    ['Responsable:', event.responsable],
    ['Municipio:', event.municipioId],
    ['Aliado:', event.aliadoId],
    ['Estado:', event.estado],
  ]
  const rightCol = [
    ['Sufijo:', event.sufijo || '—'],
    ['Dependencia:', event.dependencia || '—'],
    ['Fecha evento:', event.fechaEvento || '—'],
    ['Desembolso:', event.desembolsoId],
    ['Esquema:', event.esquema === 'cotizacion' ? 'Cotización' : 'Detalle'],
  ]

  let y = 50
  for (let i = 0; i < leftCol.length; i++) {
    doc.text(leftCol[i][0], 14, y + i * 5)
    doc.text(leftCol[i][1], 55, y + i * 5)
    doc.text(rightCol[i][0], 100, y + i * 5)
    doc.text(rightCol[i][1], 145, y + i * 5)
  }

  y += leftCol.length * 5 + 10

  doc.setFontSize(12)
  doc.text('Oferta Seleccionada', 14, y)
  y += 8

  doc.setFontSize(9)
  doc.text(`Código: ${offer.codigo}`, 14, y)
  doc.text(`Nombre: ${offer.nombre}`, 14, y + 5)
  doc.text(`Cliente: ${offer.cliente}`, 14, y + 10)

  y += 20

  const body = offer.items.map((item) => [
    item.descripcion,
    String(item.cantidad),
    formatCurrencyCO(item.valorUnitario),
    item.categoriaTributaria,
    formatCurrencyCO(item.base),
    formatCurrencyCO(item.iva),
    formatCurrencyCO(item.impuestoConsumo),
    formatCurrencyCO(item.feeTarifado + item.feeTerceros),
    formatCurrencyCO(item.ivaFee),
    formatCurrencyCO(item.total),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cant.', 'Vr. Unitario', 'Cat.', 'Base', 'IVA', 'Imp. Consumo', 'Fee', 'IVA Fee', 'Total']],
    body,
    foot: [
      [
        { content: 'TOTALES', colSpan: 4, styles: { fontStyle: 'bold' } },
        formatCurrencyCO(offer.subtotal),
        formatCurrencyCO(offer.ivaTotal),
        formatCurrencyCO(offer.impuestoConsumoTotal),
        formatCurrencyCO(offer.feeTarifadoTotal + offer.feeTercerosTotal),
        formatCurrencyCO(offer.ivaFeeTotal),
        { content: formatCurrencyCO(offer.total), styles: { fontStyle: 'bold' } },
      ],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
    footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 50 },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
    },
  })

  doc.save(`Presupuesto_${event.numeroEvento}_${offer.codigo}.pdf`)
}
