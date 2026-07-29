import { useRef } from 'react'
import { FileText, Upload, Trash2, Lock } from 'lucide-react'
import type { Soporte, TipoSoporte } from '../../../types'
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
  readOnly?: boolean
  soloModificables?: boolean
  onUpload: (tipo: TipoSoporte, file: File) => void
  onDelete: (soporteId: string) => void
}

export function SupportDocuments({ soportes, readOnly = false, soloModificables = false, onUpload, onDelete }: SupportDocumentsProps) {
  const fileInputRef = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const folderList = soloModificables ? SOPORTES_MODIFICABLES : SOPORTES_REQUERIDOS

  function getSoporte(tipo: TipoSoporte): Soporte | undefined {
    return soportes.find((s) => s.tipo === tipo)
  }

  function isEstatico(tipo: TipoSoporte): boolean {
    return (SOPORTES_ESTATICOS as readonly TipoSoporte[]).includes(tipo)
  }

  function handleFileChange(tipo: TipoSoporte, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onUpload(tipo, file)
    if (fileInputRef.current[tipo]) {
      fileInputRef.current[tipo]!.value = ''
    }
  }

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
          const isLocked = readOnly || (isEstatico(tipo) && !soloModificables)

          return (
            <div key={tipo} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${soporte ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  {soporte ? <FileText className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{tipo}</p>
                    {isLocked && soporte && (
                      <Lock className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{getFolderDescription(tipo)}</p>
                  {soporte ? (
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
                {!isLocked && (
                  <>
                    <input
                      ref={(el) => { fileInputRef.current[tipo] = el }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleFileChange(tipo, e)}
                    />
                    <button
                      onClick={() => fileInputRef.current[tipo]?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {soporte ? 'Reemplazar' : 'Cargar'}
                    </button>
                  </>
                )}
                {soporte && !isLocked && (
                  <button
                    onClick={() => onDelete(soporte.id)}
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
          {soportes.length} de {soloModificables ? SOPORTES_MODIFICABLES.length : SOPORTES_REQUERIDOS.length} carpetas cargadas
          {soloModificables && ' (solo modificables)'}
        </p>
      </div>
    </div>
  )
}
