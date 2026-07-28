import { Download } from 'lucide-react'
import type { MatrixRow, MatrixTotals } from '../types'
interface MatrixExcelExportProps {
  rows: MatrixRow[]
  totals: MatrixTotals
  aliadoIds: string[]
  aliadosMap: Record<string, string>
}

export function MatrixExcelExport({ rows, totals, aliadoIds, aliadosMap }: MatrixExcelExportProps) {
  async function handleExport() {
    const { utils, writeFile } = await import('xlsx')

    const allAliados = Object.values(aliadosMap)
    const headers = ['Desembolso', ...allAliados, 'Total General']
    const data: (string | number)[][] = [headers]

    for (const row of rows) {
      const rowData: (string | number)[] = [row.desembolsoNombre]
      for (const aId of aliadoIds) {
        const cell = row.cells[aId]
        rowData.push(cell ? cell.valorTotal : 0)
      }
      rowData.push(row.totalValor)
      data.push(rowData)
    }

    const totalsRow: (string | number)[] = ['Totales Generales']
    for (const aId of aliadoIds) {
      let colTotal = 0
      for (const r of rows) {
        if (r.cells[aId]) colTotal += r.cells[aId].valorTotal
      }
      totalsRow.push(colTotal)
    }
    totalsRow.push(totals.totalValor)
    data.push(totalsRow)

    const ws = utils.aoa_to_sheet(data)

    ws['!cols'] = [{ wch: 22 }, ...aliadoIds.map(() => ({ wch: 18 })), { wch: 18 }]

    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, 'Matriz de Ejecución')
    writeFile(wb, `matriz_ejecucion_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
    >
      <Download className="w-4 h-4" />
      Exportar Excel
    </button>
  )
}
