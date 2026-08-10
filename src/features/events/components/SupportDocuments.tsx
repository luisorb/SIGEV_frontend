import { useRef, useState } from 'react'
import { Folder, FolderOpen, ChevronRight, FileText, Upload, Trash2, Lock, Download, Loader2, X } from 'lucide-react'
import type { Soporte, TipoSoporte, Attachment, EventState } from '../../../types'
import { SOPORTES_REQUERIDOS, SOPORTES_ESTATICOS } from '../../../types'
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
  canEditFolder?: (tipo: TipoSoporte) => boolean
  eventStatus?: EventState
  devolucionLegalizacion?: boolean
  devueltoDesde?: string | null
  quotationApproved?: boolean
  onUpload: (tipo: TipoSoporte, file: File) => Promise<void>
  onDelete: (attachmentId: string) => void
  onDownload?: (attachment: Attachment) => void
}

export function SupportDocuments({
  soportes,
  attachments = [],
  readOnly = false,
  canEditFolder,
  eventStatus = 'Abierto',
  devolucionLegalizacion = false,
  devueltoDesde = null,
  quotationApproved = false,
  onUpload,
  onDelete,
  onDownload,
}: SupportDocumentsProps) {
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null)
  const [uploadingTipo, setUploadingTipo] = useState<TipoSoporte | null>(null)
  const [openFolder, setOpenFolder] = useState<TipoSoporte | null>(null)

  const folderList = SOPORTES_REQUERIDOS

  function getSoporte(tipo: TipoSoporte): Soporte | undefined {
    return soportes.find((s) => s.tipo === tipo)
  }

  function getBackendAttachments(tipo: TipoSoporte): Attachment[] {
    return attachments.filter((a) => a.category === tipo)
  }

  function isEstatico(tipo: TipoSoporte): boolean {
    return (SOPORTES_ESTATICOS as readonly TipoSoporte[]).includes(tipo)
  }

  function devueltoPermiteEstaticos(): boolean {
    return (
      !devolucionLegalizacion &&
      (devueltoDesde === 'Abierto' || devueltoDesde === null)
    )
  }

  function devueltoPermiteSoportes(): boolean {
    return (
      devolucionLegalizacion ||
      devueltoDesde === 'En ejecución' ||
      devueltoDesde === 'Ejecutado' ||
      devueltoDesde === 'Cerrado'
    )
  }

  function isFolderEditable(tipo: TipoSoporte): boolean {
    if (readOnly) return false
    if (canEditFolder && !canEditFolder(tipo)) return false
    if (tipo === 'Formato de requerimiento' && quotationApproved) return false
    if (isEstatico(tipo)) {
      return (
        eventStatus === 'Abierto' ||
        eventStatus === 'En ejecución' ||
        (eventStatus === 'Devuelto' && devueltoPermiteEstaticos())
      )
    }
    return (
      eventStatus === 'En ejecución' ||
      (eventStatus === 'Devuelto' && devueltoPermiteSoportes())
    )
  }

  async function handleFileChange(tipo: TipoSoporte, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0 || uploadingTipo) return
    setUploadingTipo(tipo)
    try {
      for (const file of files) {
        await onUpload(tipo, file)
      }
    } catch {
      // El error ya fue notificado por el manejador del padre
    } finally {
      setUploadingTipo(null)
      if (fileInputRef.current[tipo]) {
        fileInputRef.current[tipo]!.value = ''
      }
    }
  }

  function getFolderDocs(tipo: TipoSoporte): { attachments: Attachment[]; soporte?: Soporte } {
    return { attachments: getBackendAttachments(tipo), soporte: getSoporte(tipo) }
  }

  const loadedCount = folderList.filter((tipo) => {
    const soporte = getSoporte(tipo)
    const backendAttachments = getBackendAttachments(tipo)
    return !!soporte || backendAttachments.length > 0
  }).length

  const openFolderData = openFolder ? getFolderDocs(openFolder) : null

  const isMultiDocument = (tipo: TipoSoporte): boolean =>
    tipo === 'Facturas normalizadas' ||
    tipo === 'Registro fotográfico' ||
    tipo === 'Listado de asistencia' ||
    tipo === 'Cotizaciones presentadas'

  const canUploadManually = (tipo: TipoSoporte): boolean =>
    tipo !== 'Comunicado de aprobación' &&
    tipo !== 'Presupuesto final'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            <FolderOpen className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Soportes Documentales
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Carpetas obligatorias para el cierre del evento
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {folderList.map((tipo) => {
          const { attachments: docs, soporte } = getFolderDocs(tipo)
          const docCount = docs.length + (soporte ? 1 : 0)
          const hasContent = docCount > 0
          const locked = hasContent && !isFolderEditable(tipo)
          const uploading = uploadingTipo === tipo

          return (
            <button
              key={tipo}
              type="button"
              onClick={() => setOpenFolder(tipo)}
              className="group text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${hasContent ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {hasContent ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0 mt-1" />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{tipo}</p>
                  {locked && <Lock className="w-3 h-3 text-slate-300 shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{getFolderDescription(tipo)}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {uploading ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Subiendo...
                  </span>
                ) : hasContent ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                    <FileText className="w-3 h-3" />
                    {docCount} documento{docCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                    Pendiente
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          {loadedCount} de {SOPORTES_REQUERIDOS.length} carpetas cargadas
        </p>
      </div>

      {openFolder && openFolderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-[scaleIn_200ms_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
              <div className="flex items-start justify-between px-6 pt-5 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-lg flex items-center justify-center ${openFolderData.attachments.length || openFolderData.soporte ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-slate-900">{openFolder}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{getFolderDescription(openFolder)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenFolder(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  aria-label="Cerrar carpeta"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6">
              {openFolderData.attachments.length === 0 && !openFolderData.soporte ? (
                <div className="border border-dashed border-slate-300 rounded-md px-6 py-10 text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Esta carpeta no tiene documentos cargados.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {openFolderData.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50/60 transition-colors">
                      <div className="p-2 bg-slate-100 rounded-md shrink-0">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{att.originalName}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(att.fileSize / 1024).toFixed(1)} KB · {formatDateCO(att.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onDownload && (
                          <button
                            onClick={() => onDownload(att)}
                            disabled={uploadingTipo === openFolder}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
              {isFolderEditable(openFolder) &&
                openFolder !== 'Cotizaciones presentadas' &&
                canUploadManually(openFolder) && (
                          <button
                            onClick={() => setDeleteTarget(att)}
                            disabled={uploadingTipo === openFolder}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {openFolderData.soporte && (
                    <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3 bg-slate-50/40">
                      <div className="p-2 bg-slate-100 rounded-md shrink-0">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{openFolderData.soporte.nombre}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {(openFolderData.soporte.tamanio / 1024).toFixed(1)} KB · {formatDateCO(openFolderData.soporte.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isFolderEditable(openFolder) &&
                openFolder !== 'Cotizaciones presentadas' &&
                canUploadManually(openFolder) && (
                <div className="mt-5 flex items-center justify-end gap-3">
                  <input
                    ref={(el) => { fileInputRef.current[openFolder] = el }}
                    type="file"
                    multiple={isMultiDocument(openFolder)}
                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                    className="hidden"
                    disabled={uploadingTipo === openFolder}
                    onChange={(e) => handleFileChange(openFolder, e)}
                  />
                  <button
                    onClick={() => fileInputRef.current[openFolder]?.click()}
                    disabled={uploadingTipo === openFolder}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingTipo === openFolder ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingTipo === openFolder ? 'Subiendo...' : isMultiDocument(openFolder) ? 'Cargar documentos' : 'Cargar documento'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
