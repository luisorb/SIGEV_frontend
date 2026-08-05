import * as XLSX from 'xlsx'
import type { Offer } from '../types'
import type { Ally } from '../../../types'

export function exportOfferToExcel(offer: Offer, aliados: Ally[] = []): void {
  const wb = XLSX.utils.book_new()

  const aliadoName = (aliadoId?: string): string => {
    if (!aliadoId) return offer.aliado || 'General'
    return aliados.find((a) => a.id === aliadoId)?.nombre ?? aliadoId
  }

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
    'Aliado',
    'Cant.',
    'Vr. Unitario',
    'Cat. Tributaria',
    'Base',
    'IVA',
    'Imp. Consumo',
    'Fee',
    'IVA Fee',
    'Total',
  ]

  const itemRows = offer.items.map((item) => [
    item.descripcion,
    aliadoName(item.aliadoId),
    item.cantidad,
    item.valorUnitario,
    item.categoriaTributaria,
    item.base,
    item.iva,
    item.impuestoConsumo,
    item.feeTarifado + item.feeTerceros,
    item.ivaFee,
    item.total,
  ])

  const pad = Array(itemHeader.length - 1).fill('')
  const totalsRows = [
    ['SUBTOTAL', ...pad, offer.subtotal],
    ['IVA TOTAL', ...pad, offer.ivaTotal],
    ['IMP. CONSUMO TOTAL', ...pad, offer.impuestoConsumoTotal],
    ['FEE TOTAL', ...pad, offer.feeTarifadoTotal + offer.feeTercerosTotal],
    ['IVA FEE TOTAL', ...pad, offer.ivaFeeTotal],
    ['TOTAL OFERTA', ...pad, offer.total],
  ]

  const sheetData = [...header, itemHeader, ...itemRows, ...totalsRows]

  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  ws['!cols'] = [
    { wch: 36 },
    { wch: 20 },
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Oferta')
  XLSX.writeFile(wb, `${offer.codigo.replace(/[^a-zA-Z0-9_-]/g, '_')}_oferta_economica.xlsx`)
}
