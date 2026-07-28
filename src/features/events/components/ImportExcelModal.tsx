import { useState, useCallback } from 'react'
import { X, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { ItemInput } from '../../../types'
import { itemSchema } from '../schemas/itemSchema'

interface ExcelRow {
  row: number
  descripcion?: string
  cantidad?: number
  valorUnitario?: number
  categoriaTributaria?: string
  errors: string[]
}

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (items: ItemInput[]) => void
}

export function ImportExcelModal({ isOpen, onClose, onImport }: ImportExcelModalProps) {
  const [parsedRows, setParsedRows] = useState<ExcelRow[]>([])
  const [dragOver, setDragOver] = useState(false)

  const validRows = parsedRows.filter((r) => r.errors.length === 0 && r.descripcion && r.cantidad && r.valorUnitario !== undefined)
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0)

  const processFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' })

      const rows: ExcelRow[] = json.map((row, idx) => {
        const result: ExcelRow = {
          row: idx + 2,
          errors: [],
          descripcion: String(row['descripcion'] ?? row['Descripcion'] ?? ''),
          cantidad: Number(row['cantidad'] ?? row['Cantidad'] ?? 0),
          valorUnitario: Number(row['valorUnitario'] ?? row['ValorUnitario'] ?? row['Valor Unitario'] ?? 0),
          categoriaTributaria: String(row['categoriaTributaria'] ?? row['CategoriaTributaria'] ?? row['Categoría'] ?? ''),
        }

        const parseResult = itemSchema.safeParse({
          descripcion: result.descripcion,
          cantidad: result.cantidad,
          valorUnitario: result.valorUnitario,
          categoriaTributaria: result.categoriaTributaria,
        })

        if (!parseResult.success) {
          result.errors = parseResult.error.issues.map(
            (iss) => `${iss.path.join('.')}: ${iss.message}`,
          )
        }

        if (!result.descripcion) {
          result.errors.push('descripcion: La descripción es obligatoria')
        }

        return result
      })

      setParsedRows(rows)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleImport() {
    const items: ItemInput[] = validRows.map((r) => ({
      descripcion: r.descripcion!,
      cantidad: r.cantidad!,
      valorUnitario: r.valorUnitario!,
      categoriaTributaria: r.categoriaTributaria as ItemInput['categoriaTributaria'],
    }))
    onImport(items)
    handleClose()
  }

  function handleClose() {
    setParsedRows([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Importar desde Excel</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {parsedRows.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-700 mb-1">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Formatos soportados: .xlsx, .xls
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
                Seleccionar archivo
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    {validRows.length} válidas
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      {invalidRows.length} con errores
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setParsedRows([])}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Limpiar
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Fila</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Descripción</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Cant.</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 uppercase">Vr. Unit.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Categoría</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row) => (
                        <tr key={row.row} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 text-slate-500">{row.row}</td>
                          <td className="px-3 py-2 text-slate-900">{row.descripcion}</td>
                          <td className="px-3 py-2 text-right text-slate-600">{row.cantidad}</td>
                          <td className="px-3 py-2 text-right text-slate-600">
                            {row.valorUnitario?.toLocaleString('es-CO')}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.categoriaTributaria}</td>
                          <td className="px-3 py-2">
                            {row.errors.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600" title={row.errors.join('; ')}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {row.errors.length} error(es)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Válida
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs font-medium text-red-700 mb-1">Errores de validación:</p>
                  <ul className="space-y-0.5">
                    {invalidRows.slice(0, 5).map((row) => (
                      <li key={row.row} className="text-xs text-red-600">
                        Fila {row.row}: {row.errors[0]}
                      </li>
                    ))}
                    {invalidRows.length > 5 && (
                      <li className="text-xs text-red-500">
                        ...y {invalidRows.length - 5} fila(s) más con errores
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {parsedRows.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={() => setParsedRows([])}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Importar {validRows.length} ítem(s)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
