import * as XLSX from 'xlsx'
import type { Offer, OfferExportOptions } from '../types'
import {
  esquemaLabel,
  taxRateLabel,
  aliadoName,
  resolveMunicipio,
  splitNumeroEvento,
  displayItemsForExport,
} from './exportHelpers'

function formatFechaCorte(date: Date): string {
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function exportOfferToExcel(offer: Offer, options: OfferExportOptions = {}): void {
  const {
    event,
    aliados = [],
    municipios = [],
    rates,
    usuario = '',
    fechaCorte = new Date(),
    filtros = 'Ninguno',
  } = options

  const municipio = event ? resolveMunicipio(event.municipioId, municipios) : undefined
  const numSufijo = event ? { numero: event.numeroEvento, sufijo: event.sufijo } : splitNumeroEvento(offer.numeroEvento ?? '')
  const responsable = event?.responsable ?? offer.responsable ?? ''
  const dependencia = event?.dependencia ?? offer.dependencia ?? ''
  const aliadoGeneral = event
    ? (aliados.find((a) => a.id === event.aliadoId)?.nombre ?? offer.aliado ?? '')
    : (offer.aliado ?? '')
  const desembolso = offer.desembolso ?? ''
  const esquema = esquemaLabel(event?.esquema ?? offer.esquema)

  const { items, totals } = displayItemsForExport(offer)

  const wb = XLSX.utils.book_new()

  // Hoja: Identificación
  const idRows = [
    ['OFERTA ECONÓMICA - SIGEV'],
    [],
    ['Identificación de la oferta'],
    ['Código', offer.codigo],
    ['Número de evento', numSufijo.numero],
    ['Sufijo', numSufijo.sufijo],
    ['Cliente (responsable)', responsable],
    ['Estado', offer.eventoEstado || offer.estado],
    ['Fecha', offer.fechaEjecucion ?? ''],
    ['Ítems', String(offer.items.length)],
    ['Total', offer.total],
    [],
    ['Ubicación territorial (DIVIPOLA)'],
    ['Departamento', municipio?.departamento ?? ''],
    ['Municipio', municipio?.nombre ?? offer.municipio ?? ''],
    ['Vereda', event?.vereda ?? ''],
    [],
    ['Información del evento'],
    ['Dependencia', dependencia],
    ['Esquema de presentación', esquema],
    ['Asistentes', event ? String(event.asistentes) : ''],
    ['Días', event ? String(event.dias) : ''],
    [],
    ['Asignaciones maestras'],
    ['Aliado (operador logístico general)', aliadoGeneral],
    ['Desembolso (bolsa presupuestal)', desembolso],
    [],
    ['Parámetros de exportación'],
    ['Fecha de corte', formatFechaCorte(fechaCorte)],
    ['Usuario que generó el reporte', usuario],
    ['Filtros aplicados', filtros],
  ]
  const wsId = XLSX.utils.aoa_to_sheet(idRows)
  wsId['!cols'] = [{ wch: 42 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, wsId, 'Identificación')

  // Hoja: Ítems
  const itemHeader = [
    'Descripción',
    'Aliado',
    'Cant.',
    'Vr. Unitario',
    'Clasificación',
    'Tasa',
    'Base',
    'IVA',
    'Imp. Consumo',
    'Fee Téc. Adm.',
    'IVA Fee',
    'Total',
  ]
  const itemRows = items.map((item) => [
    item.descripcion,
    aliadoName(offer, item.aliadoId, aliados),
    item.cantidad,
    item.valorUnitario,
    item.categoriaTributaria,
    taxRateLabel(item, rates),
    item.base,
    item.iva,
    item.impuestoConsumo,
    item.feeTarifado + item.feeTerceros,
    item.ivaFee,
    item.total,
  ])
  const wsItems = XLSX.utils.aoa_to_sheet([itemHeader, ...itemRows])
  wsItems['!cols'] = [
    { wch: 42 },
    { wch: 22 },
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 8 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Ítems')

  // Hoja: Resumen
  const summaryRows = [
    ['RESUMEN ECONÓMICO - TOTALES CONSOLIDADOS'],
    [],
    ['Base acumulada', totals.base],
    ['IVA (19%)', totals.iva],
    ['Impuesto al Consumo (8%)', totals.consumo],
    ['Total Impuestos', totals.iva + totals.consumo],
    ['Fee Técnico Administrativo Total', totals.fee],
    ['IVA sobre el Fee (19%)', totals.ivaFee],
    ['Gran Total del Evento', totals.total],
    [],
    [`Número de ítems: ${items.length}`],
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary['!cols'] = [{ wch: 42 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen')

  const safeCodigo = offer.codigo.replace(/[^a-zA-Z0-9_-]/g, '_')
  XLSX.writeFile(wb, `${safeCodigo}_oferta_economica.xlsx`)
}
