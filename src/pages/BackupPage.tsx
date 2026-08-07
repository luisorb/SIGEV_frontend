import { useState, useEffect, useCallback } from 'react'
import { DatabaseBackup, RefreshCw, Download, Loader2, HardDrive, ShieldCheck, FileText, Clock } from 'lucide-react'
import { useToast } from '../components/ToastProvider'
import { createBackupApi, getBackupsApi, downloadBackupApi } from '../services/backup.service'
import type { BackupFile } from '../services/backup.service'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function BackupPage() {
  const toast = useToast()
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBackupsApi()
      setBackups(data)
      setError(null)
    } catch {
      setError('No se pudieron cargar los respaldos desde el servidor.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function initialLoad() {
      try {
        const data = await getBackupsApi()
        if (!cancelled) setBackups(data)
        if (!cancelled) setError(null)
      } catch {
        if (!cancelled) setError('No se pudieron cargar los respaldos desde el servidor.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    initialLoad()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const created = await createBackupApi()
      toast.showToast(`Respaldo "${created.file}" generado correctamente`, 'success')
      await load()
    } catch {
      toast.showToast('Error al generar el respaldo. Verifica la ruta de pg_dump.', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleDownload(id: string) {
    try {
      await downloadBackupApi(id)
    } catch {
      toast.showToast('Error al descargar el respaldo.', 'error')
    }
  }

  return (
    <div className="flex flex-col min-h-0 gap-4">
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <DatabaseBackup className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Respaldo de Base de Datos</h1>
        </div>
        <p className="text-sm text-slate-500">
          Genera y descarga copias de seguridad (SQL) de la base de datos. Solo Administrador Técnico.
        </p>
      </div>

      <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Respaldos disponibles</p>
            <p className="text-xs text-slate-500">
              {loading ? 'Cargando...' : `${backups.length} respaldo${backups.length !== 1 ? 's' : ''} en el servidor`}
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {creating ? 'Generando respaldo...' : 'Generar respaldo ahora'}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Archivos .sql</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-slate-500">Cargando respaldos...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">No hay respaldos generados</p>
            <p className="text-xs text-slate-300 mt-1">Usa el botón "Generar respaldo ahora" para crear la primera copia.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Archivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Fecha</span>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamaño</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 font-mono text-xs sm:text-sm text-slate-700">{b.file}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-slate-500">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-slate-600 text-right tabular-nums">{formatBytes(b.size)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDownload(b.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                        title="Descargar respaldo"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
