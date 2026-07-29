import * as XLSX from 'xlsx'
import type { Offer } from '../types'

export function exportOfferToExcel(offer: Offer): void {
  const wb = XLSX.utils.book_new()

  const header = [
    ['OFERTA ECONÓMICA - SIGEV'],
    [],
    ['Código:', offer.codigo, '', 'Estado:', offer.estado],
    ['Nombre:', offer.nombre],
    ['Cliente:', offer.cliente],
    ['N° Evento:', offer.numeroEvento || 'N/A', '', 'Responsable:', offer.responsable || 'N/A'],
    ['Municipio:', offer.municipio || 'N/A', '', 'Aliado:', offer.aliado || 'N/A'],
    ['Desembolso:', offer.desembolso || 'N/A', '', 'Esquema:', offer.esquema || 'N/A'],
    ['Fecha:', new Date(offer.createdAt).toLocaleDateString('es-CO')],
    [],
  ]

  const itemHeader = [
    'Descripción',
    'Cant.',
    'Vr. Unitario',
    'Cat. Tributaria',
    'Base',
    'IVA',
    'Imp. Consumo',
    'Fee Tarifado',
    'Fee Terceros',
    'IVA Fee',
    'Total',
  ]

  const itemRows = offer.items.map((item) => [
    item.descripcion,
    item.cantidad,
    item.valorUnitario,
    item.categoriaTributaria,
    item.base,
    item.iva,
    item.impuestoConsumo,
    item.feeTarifado,
    item.feeTerceros,
    item.ivaFee,
    item.total,
  ])

  const totalsRows = [
    [],
    ['SUBTOTAL', '', '', '', '', offer.subtotal],
    ['IVA TOTAL', '', '', '', '', offer.ivaTotal],
    ['IMP. CONSUMO TOTAL', '', '', '', '', offer.impuestoConsumoTotal],
    ['FEE TARIFADO TOTAL', '', '', '', '', offer.feeTarifadoTotal],
    ['FEE TERCEROS TOTAL', '', '', '', '', offer.feeTercerosTotal],
    ['IVA FEE TOTAL', '', '', '', '', offer.ivaFeeTotal],
    ['TOTAL OFERTA', '', '', '', '', offer.total],
  ]

  const sheetData = [...header, itemHeader, ...itemRows, ...totalsRows]

  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  ws['!cols'] = [
    { wch: 36 },
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Oferta')
  XLSX.writeFile(wb, `${offer.codigo.replace(/[^a-zA-Z0-9_-]/g, '_')}_oferta_economica.xlsx`)
}
