import { Download } from 'lucide-react'
import type { DetailedRow, MatrixRow, MatrixTotals } from '../types'

interface MatrixExcelExportProps {
  detailedRows: DetailedRow[]
  globalRows: MatrixRow[]
  totals: MatrixTotals
  aliadoIds: string[]
  aliadosMap: Record<string, string>
}

export function MatrixExcelExport({ detailedRows, globalRows, totals, aliadoIds, aliadosMap }: MatrixExcelExportProps) {
  async function handleExport() {
    const { utils, writeFile } = await import('xlsx')

    const wb = utils.book_new()

    const detHeaders = [
      'Evento', 'Fecha', 'Territorio', 'Estado',
      'Descripción', 'Cantidad', 'Valor Unitario', 'Carga Tributaria',
      'Base', 'IVA', 'Consumo', 'FEE Tarifado', 'FEE Terceros', 'IVA FEE',
      'Total', 'Aliado', 'Recurso disponible',
    ]
    const detData: (string | number)[][] = [detHeaders]

    for (const r of detailedRows) {
      detData.push([
        r.numeroEvento,
        r.fechaEvento,
        r.municipio,
        r.estado,
        r.descripcion,
        r.cantidad,
        r.valorUnitario,
        r.categoriaTributaria,
        r.base,
        r.iva,
        r.impuestoConsumo,
        r.feeTarifado,
        r.feeTerceros,
        r.ivaFee,
        r.total,
        r.aliadoNombre,
        r.desembolsoNombre,
      ])
    }

    const detWs = utils.aoa_to_sheet(detData)
    detWs['!cols'] = [
      { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      { wch: 30 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 16 }, { wch: 18 }, { wch: 18 },
    ]
    utils.book_append_sheet(wb, detWs, 'Matriz Detallada')

    const allAliados = Object.values(aliadosMap)
    const globHeaders = ['Recurso disponible', ...allAliados, 'Total General']
    const globData: (string | number)[][] = [globHeaders]

    for (const row of globalRows) {
      const rowData: (string | number)[] = [row.desembolsoNombre]
      for (const aId of aliadoIds) {
        const cell = row.cells[aId]
        rowData.push(cell ? cell.valorTotal : 0)
      }
      rowData.push(row.totalValor)
      globData.push(rowData)
    }

    const totalsRow: (string | number)[] = ['Totales Generales']
    for (const aId of aliadoIds) {
      let colTotal = 0
      for (const r of globalRows) {
        if (r.cells[aId]) colTotal += r.cells[aId].valorTotal
      }
      totalsRow.push(colTotal)
    }
    totalsRow.push(totals.totalValor)
    globData.push(totalsRow)

    const globWs = utils.aoa_to_sheet(globData)
    globWs['!cols'] = [{ wch: 22 }, ...aliadoIds.map(() => ({ wch: 18 })), { wch: 18 }]
    utils.book_append_sheet(wb, globWs, 'Matriz Global')

    writeFile(wb, `matriz_ejecucion_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
    >
      <Download className="w-4 h-4" />
      Exportar Excel
    </button>
  )
}
