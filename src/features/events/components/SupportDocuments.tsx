import { useRef, useState } from 'react'
import { FileText, Upload, Trash2, Lock, Download, Loader2 } from 'lucide-react'
import type { Soporte, TipoSoporte, Attachment, EventState } from '../../../types'
import { SOPORTES_REQUERIDOS, SOPORTES_ESTATICOS, SOPORTES_MODIFICABLES } from '../../../types'
import { formatDateCO } from '../../../utils/formatters'
import { ConfirmDialog } from '../../../components/ConfirmDialog'

function getFolderDescription(tipo: TipoSoporte): string {
  const desc: Record<TipoSoporte, string> = {
    'Formato de requerimiento': 'Formato oficial de solicitud del evento',
    'Cotizaciones presentadas': 'Cotizaciones cargadas por el operador logístico',
    'Comunicado de aprobación': 'Comunicado oficial de aprobación del presupuesto',
    'Presupuesto final': 'PDF del presupuesto final aprobado',
    'Facturas normalizadas': 'Facturas oficiales del evento ejecutado',
    'Registro fotográfico': 'Evidencia fotográfica categorizada',
    'Listado de asistencia': 'Registro de asistencia de participantes',
  }
  return desc[tipo]
}

interface SupportDocumentsProps {
  soportes: Soporte[]
  attachments?: Attachment[]
  readOnly?: boolean
  soloModificables?: boolean
  eventStatus?: EventState
  devolucionLegalizacion?: boolean
  onUpload: (tipo: TipoSoporte, file: File) => Promise<void>
  onDelete: (attachmentId: string) => void
  onDownload?: (attachment: Attachment) => void
}

export function SupportDocuments({
  soportes,
  attachments = [],
  readOnly = false,
  soloModificables = false,
  eventStatus = 'Abierto',
  devolucionLegalizacion = false,
  onUpload,
  onDelete,
  onDownload,
}: SupportDocumentsProps) {
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null)
  const [uploadingTipo, setUploadingTipo] = useState<TipoSoporte | null>(null)

  const folderList = soloModificables ? SOPORTES_MODIFICABLES : SOPORTES_REQUERIDOS

  function getSoporte(tipo: TipoSoporte): Soporte | undefined {
    return soportes.find((s) => s.tipo === tipo)
  }

  function getBackendAttachments(tipo: TipoSoporte): Attachment[] {
    return attachments.filter((a) => a.category === tipo)
  }

  function isEstatico(tipo: TipoSoporte): boolean {
    return (SOPORTES_ESTATICOS as readonly TipoSoporte[]).includes(tipo)
  }

  function isFolderEditable(tipo: TipoSoporte): boolean {
    if (readOnly) return false
    if (tipo === 'Formato de requerimiento') return false
    if (isEstatico(tipo)) {
      return (
        eventStatus === 'Abierto' ||
        eventStatus === 'En ejecución' ||
        (eventStatus === 'Devuelto' && !devolucionLegalizacion)
      )
    }
    return (
      eventStatus === 'Abierto' ||
      eventStatus === 'En ejecución' ||
      eventStatus === 'Ejecutado' ||
      eventStatus === 'Cerrado' ||
      eventStatus === 'Devuelto'
    )
  }

  async function handleFileChange(tipo: TipoSoporte, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || uploadingTipo) return
    setUploadingTipo(tipo)
    try {
      await onUpload(tipo, file)
    } catch {
      // El error ya fue notificado por el manejador del padre
    } finally {
      setUploadingTipo(null)
      if (fileInputRef.current[tipo]) {
        fileInputRef.current[tipo]!.value = ''
      }
    }
  }

  const loadedCount = folderList.filter((tipo) => {
    const soporte = getSoporte(tipo)
    const backendAttachments = getBackendAttachments(tipo)
    return !!soporte || backendAttachments.length > 0
  }).length

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Soportes Documentales
          {soloModificables && <span className="ml-2 text-amber-600 font-normal">(solo carpetas modificables)</span>}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {soloModificables
            ? 'Carpetas 5-7: pueden ser reemplazadas tras devolución del aprobador'
            : 'Carpetas obligatorias para el cierre del evento'}
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {folderList.map((tipo) => {
          const soporte = getSoporte(tipo)
          const backendAttachments = getBackendAttachments(tipo)
          const hasContent = !!soporte || backendAttachments.length > 0
          const editable = isFolderEditable(tipo)
          const locked = hasContent && !editable
          const uploading = uploadingTipo === tipo
          const esCotizaciones = tipo === 'Cotizaciones presentadas'
          const editableTab = editable && !esCotizaciones

          return (
            <div key={tipo} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${hasContent ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {hasContent ? <FileText className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{tipo}</p>
                    {locked && <Lock className="w-3 h-3 text-slate-300" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{getFolderDescription(tipo)}</p>
                  {uploading ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Subiendo documento...
                      </span>
                    </div>
                  ) : backendAttachments.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {backendAttachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-2">
                          <span className="text-xs text-green-600 font-medium truncate max-w-[200px]">{att.originalName}</span>
                          <span className="text-[10px] text-slate-400">({(att.fileSize / 1024).toFixed(1)} KB)</span>
                          <span className="text-[10px] text-slate-400">· {formatDateCO(att.createdAt)}</span>
                          {onDownload && (
                            <button
                              onClick={() => onDownload(att)}
                              disabled={uploading}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-primary bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Descargar adjunto"
                            >
                              <Download className="w-3 h-3" />
                              Descargar
                            </button>
                          )}
                          {editableTab && (
                            <button
                              onClick={() => setDeleteTarget(att)}
                              disabled={uploading}
                              className="p-1 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Eliminar adjunto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : soporte ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-green-600 font-medium truncate max-w-[200px]">{soporte.nombre}</span>
                      <span className="text-[10px] text-slate-400">({(soporte.tamanio / 1024).toFixed(1)} KB)</span>
                      <span className="text-[10px] text-slate-400">· {formatDateCO(soporte.createdAt)}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-500 mt-0.5">Pendiente</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editableTab && (
                  <>
                    <input
                      ref={(el) => { fileInputRef.current[tipo] = el }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => handleFileChange(tipo, e)}
                    />
                    <button
                      onClick={() => fileInputRef.current[tipo]?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {uploading ? 'Subiendo...' : hasContent ? 'Reemplazar' : 'Cargar'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {loadedCount} de {soloModificables ? SOPORTES_MODIFICABLES.length : SOPORTES_REQUERIDOS.length} carpetas cargadas
          {soloModificables && ' (solo modificables)'}
        </p>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          title="Eliminar soporte documental"
          message={`¿Está seguro de eliminar "${deleteTarget.originalName}"? Esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => {
            onDelete(deleteTarget.id)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
