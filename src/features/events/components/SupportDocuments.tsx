import { useRef, useState, useCallback } from 'react'
import { Folder, FolderOpen, ChevronRight, FileText, Upload, Trash2, Lock, Download, Loader2, X, Image, Sheet, FileUp, Film } from 'lucide-react'
import type { Soporte, TipoSoporte, Attachment, EventState } from '../../../types'
import { SOPORTES_REQUERIDOS, SOPORTES_ESTATICOS } from '../../../types'
import { formatDateCO } from '../../../utils/formatters'
import { ConfirmDialog } from '../../../components/ConfirmDialog'

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return { icon: Image, color: 'text-violet-500', bg: 'bg-violet-50' }
  if (mimeType.startsWith('video/')) return { icon: Film, color: 'text-blue-500', bg: 'bg-blue-50' }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'application/vnd.ms-excel')
    return { icon: Sheet, color: 'text-emerald-500', bg: 'bg-emerald-50' }
  return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50' }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  hideHeader?: boolean
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
  hideHeader = false,
  onUpload,
  onDelete,
  onDownload,
}: SupportDocumentsProps) {
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null)
  const [uploadingTipo, setUploadingTipo] = useState<TipoSoporte | null>(null)
  const [openFolder, setOpenFolder] = useState<TipoSoporte | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, tipo: TipoSoporte) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (uploadingTipo) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    setUploadingTipo(tipo)
    try {
      for (const file of files) {
        await onUpload(tipo, file)
      }
    } catch {
      // El error ya fue notificado por el manejador del padre
    } finally {
      setUploadingTipo(null)
    }
  }, [uploadingTipo, onUpload])

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
      {!hideHeader && (
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
      )}

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
                isFolderEditable(openFolder) &&
                openFolder !== 'Cotizaciones presentadas' &&
                canUploadManually(openFolder) ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, openFolder)}
                    onClick={() => fileInputRef.current[openFolder]?.click()}
                    className={`border-2 border-dashed rounded-xl px-6 py-12 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={(el) => { fileInputRef.current[openFolder] = el }}
                      type="file"
                      multiple={isMultiDocument(openFolder)}
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.mp4,.mov,.webm,.avi"
                      className="hidden"
                      disabled={uploadingTipo === openFolder}
                      onChange={(e) => handleFileChange(openFolder, e)}
                    />
                    {uploadingTipo === openFolder ? (
                      <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                    ) : (
                      <FileUp className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? 'text-primary' : 'text-slate-300'}`} />
                    )}
                    <p className="text-sm font-medium text-slate-700">
                      {uploadingTipo === openFolder
                        ? 'Subiendo documentos...'
                        : isDragOver
                          ? 'Suelta los archivos aquí'
                          : 'Arrastra archivos aquí o haz clic para seleccionar'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">
                      {isMultiDocument(openFolder) ? 'Puedes seleccionar varios archivos' : 'Selecciona un archivo'} · PDF, JPG, PNG, XLSX, DOC
                    </p>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl px-6 py-10 text-center">
                    <Folder className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No hay documentos en esta carpeta</p>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {openFolderData.attachments.map((att) => {
                    const fileIcon = getFileIcon(att.mimeType)
                    const IconComp = fileIcon.icon
                    return (
                      <div key={att.id} className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3 hover:bg-slate-50/60 transition-colors">
                        <div className={`p-2 rounded-md shrink-0 ${fileIcon.bg}`}>
                          <IconComp className={`w-4 h-4 ${fileIcon.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 truncate">{att.originalName}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {formatFileSize(att.fileSize)} · {formatDateCO(att.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onDownload && (
                            <button
                              onClick={() => onDownload(att)}
                              disabled={uploadingTipo === openFolder}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-primary transition-colors disabled:opacity-50"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Descargar
                            </button>
                          )}
                          {isFolderEditable(openFolder) &&
                            openFolder !== 'Cotizaciones presentadas' &&
                            canUploadManually(openFolder) && (
                              <button
                                onClick={() => setDeleteTarget(att)}
                                disabled={uploadingTipo === openFolder}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-slate-200 rounded-md hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Eliminar
                              </button>
                            )}
                        </div>
                      </div>
                    )
                  })}

                  {openFolderData.soporte && (
                    <div className="flex items-center gap-3 border border-slate-200 rounded-lg px-4 py-3 bg-slate-50/40">
                      <div className="p-2 bg-slate-100 rounded-md shrink-0">
                        <FileText className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{openFolderData.soporte.nombre}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatFileSize(openFolderData.soporte.tamanio)} · {formatDateCO(openFolderData.soporte.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isFolderEditable(openFolder) &&
                openFolder !== 'Cotizaciones presentadas' &&
                canUploadManually(openFolder) &&
                (openFolderData.attachments.length > 0 || openFolderData.soporte) && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, openFolder)}
                  onClick={() => fileInputRef.current[openFolder]?.click()}
                  className={`mt-4 border-2 border-dashed rounded-xl px-6 py-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                  }`}
                >
                  <input
                    ref={(el) => { fileInputRef.current[openFolder] = el }}
                    type="file"
                    multiple={isMultiDocument(openFolder)}
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.mp4,.mov,.webm,.avi"
                    className="hidden"
                    disabled={uploadingTipo === openFolder}
                    onChange={(e) => handleFileChange(openFolder, e)}
                  />
                  {uploadingTipo === openFolder ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm font-medium text-primary">Subiendo documentos...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-6 h-6 mx-auto mb-1.5 ${isDragOver ? 'text-primary' : 'text-slate-400'}`} />
                      <p className="text-sm font-medium text-slate-600">
                        {isDragOver ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic para agregar'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                      {isMultiDocument(openFolder) ? 'Puedes seleccionar varios archivos' : 'Selecciona un archivo'} · PDF, JPG, PNG, XLSX, DOC, MP4
                      </p>
                    </>
                  )}
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
