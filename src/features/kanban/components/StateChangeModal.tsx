import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import type { StateChangeRequest } from '../types'

const stateLabels: Record<string, string> = {
  Abierto: 'Abierto',
  'En ejecución': 'En ejecución',
  Ejecutado: 'Ejecutado',
  Cerrado: 'Cerrado',
  Legalizado: 'Legalizado',
  Devuelto: 'Devuelto',
  Rechazado: 'Rechazado',
}

interface StateChangeModalProps {
  pendingChange: StateChangeRequest
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

export function StateChangeModal({ pendingChange, onConfirm, onCancel }: StateChangeModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const isDevolucion = pendingChange.to === 'Devuelto'

  function handleConfirm() {
    if (isDevolucion && reason.trim().length < 3) {
      setError('La observación es obligatoria (mínimo 3 caracteres) para devolver el evento')
      return
    }
    onConfirm(reason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-900">Cambiar Estado</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 font-medium text-slate-700">
              {stateLabels[pendingChange.from]}
            </span>
            <span className="text-slate-400 text-lg">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-red-100 font-medium text-red-700">
              {stateLabels[pendingChange.to]}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Observación / Motivo
              {isDevolucion && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              placeholder={isDevolucion ? 'Obligatorio: describe el motivo de la devolución...' : 'Opcional: describe el motivo del cambio de estado...'}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
          >
            Confirmar Cambio
          </button>
        </div>
      </div>
    </div>
  )
}
