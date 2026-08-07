import { useRef, useState } from 'react'
import { FileText, Upload, Trash2, Lock, Download, Info } from 'lucide-react'
import type { Soporte, TipoSoporte, Attachment, EventState } from '../../../types'
import { SOPORTES_REQUERIDOS, SOPORTES_ESTATICOS, SOPORTES_MODIFICABLES } from '../../../types'
import { formatDateCO } from '../../../utils/formatters'

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
  onUpload: (tipo: TipoSoporte, file: File) => void
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
  onDownload,
}: SupportDocumentsProps) {
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [pendingAction, setPendingAction] = useState<'cargar' | 'reemplazar' | 'eliminar' | null>(null)

  const actionMessages: Record<string, string> = {
    cargar: 'La carga de soportes documentales está en desarrollo y estará disponible próximamente.',
    reemplazar: 'El reemplazo de soportes documentales está en desarrollo y estará disponible próximamente.',
    eliminar: 'La eliminación de soportes documentales está en desarrollo y estará disponible próximamente.',
  }

  const folderList = soloModificables ? SOPORTES_MODIFICABLES : SOPORTES_REQUERIDOS

  function getSoporte(tipo: TipoSoporte): Soporte | undefined {
    return soportes.find((s) => s.tipo === tipo)
  }

  function getBackendAttachment(tipo: TipoSoporte): Attachment | undefined {
    return attachments.find((a) => a.category === tipo)
  }

  function isEstatico(tipo: TipoSoporte): boolean {
    return (SOPORTES_ESTATICOS as readonly TipoSoporte[]).includes(tipo)
  }

  function isFolderEditable(tipo: TipoSoporte): boolean {
    if (readOnly) return false
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

  function handleFileChange(tipo: TipoSoporte, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(tipo, file)
    if (fileInputRef.current[tipo]) {
      fileInputRef.current[tipo]!.value = ''
    }
  }

  const loadedCount = folderList.filter((tipo) => !!getSoporte(tipo) || !!getBackendAttachment(tipo)).length

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
          const backendAttachment = getBackendAttachment(tipo)
          const hasContent = !!soporte || !!backendAttachment
          const editable = isFolderEditable(tipo)
          const locked = hasContent && !editable

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
                  {backendAttachment ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-green-600 font-medium truncate max-w-[200px]">{backendAttachment.originalName}</span>
                      <span className="text-[10px] text-slate-400">({(backendAttachment.fileSize / 1024).toFixed(1)} KB)</span>
                      <span className="text-[10px] text-slate-400">· {formatDateCO(backendAttachment.createdAt)}</span>
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
                {backendAttachment && onDownload && (
                  <button
                    onClick={() => onDownload(backendAttachment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                    title="Descargar adjunto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </button>
                )}
                {editable && (
                  <>
                    <input
                      ref={(el) => { fileInputRef.current[tipo] = el }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleFileChange(tipo, e)}
                    />
                    <button
                      onClick={() => setPendingAction(hasContent ? 'reemplazar' : 'cargar')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {hasContent ? 'Reemplazar' : 'Cargar'}
                    </button>
                  </>
                )}
                {hasContent && editable && (
                  <button
                    onClick={() => setPendingAction('eliminar')}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar soporte"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl shrink-0 bg-primary/10 text-primary">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">Funcionalidad en desarrollo</h3>
                <p className="text-sm text-slate-500 mt-1">{actionMessages[pendingAction]}</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
