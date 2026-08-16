import { useState, useEffect, useRef } from 'react'
import { X, ArrowRight, RotateCcw, Ban, CheckCircle2, AlertCircle } from 'lucide-react'
import type { StateChangeRequest } from '../types'

const stateConfig: Record<string, { label: string; color: string; bg: string; ring: string; icon: string }> = {
  Abierto: { label: 'Abierto', color: 'text-yellow-700', bg: 'bg-yellow-50', ring: 'ring-yellow-300', icon: 'bg-yellow-500' },
  'En ejecución': { label: 'En ejecución', color: 'text-blue-700', bg: 'bg-blue-50', ring: 'ring-blue-300', icon: 'bg-blue-500' },
  Ejecutado: { label: 'Ejecutado', color: 'text-orange-700', bg: 'bg-orange-50', ring: 'ring-orange-300', icon: 'bg-orange-500' },
  Cerrado: { label: 'Cerrado', color: 'text-slate-700', bg: 'bg-slate-100', ring: 'ring-slate-300', icon: 'bg-slate-500' },
  Legalizado: { label: 'Legalizado', color: 'text-purple-700', bg: 'bg-purple-50', ring: 'ring-purple-300', icon: 'bg-purple-500' },
  Devuelto: { label: 'Devuelto', color: 'text-amber-700', bg: 'bg-amber-50', ring: 'ring-amber-300', icon: 'bg-amber-500' },
  Cancelado: { label: 'Cancelado', color: 'text-rose-700', bg: 'bg-rose-50', ring: 'ring-rose-300', icon: 'bg-rose-500' },
}

function getTransitionMeta(from: string, to: string) {
  if (to === 'Cancelado') {
    return {
      type: 'reject' as const,
      icon: Ban,
      title: 'Cancelar evento',
      description: 'El evento será rechazado y no podrá avanzar en el flujo.',
      confirmLabel: 'Cancelar evento',
      confirmColor: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    }
  }
  if (to === 'Devuelto') {
    return {
      type: 'return' as const,
      icon: RotateCcw,
      title: 'Devolver evento',
      description: 'El evento será devuelto para revisión. Se reqiuere una observación.',
      confirmLabel: 'Devolver evento',
      confirmColor: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    }
  }
  return {
    type: 'advance' as const,
    icon: CheckCircle2,
    title: 'Avanzar evento',
    description: 'El evento avanzará al siguiente estado del flujo.',
    confirmLabel: 'Confirmar cambio',
    confirmColor: 'bg-primary hover:bg-primary-dark focus:ring-primary',
  }
}

interface StateChangeModalProps {
  pendingChange: StateChangeRequest
  onConfirm: (reason?: string) => void
  onCancel: () => void
}

export function StateChangeModal({ pendingChange, onConfirm, onCancel }: StateChangeModalProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const { from, to } = pendingChange
  const requiresObservation = to === 'Devuelto' || to === 'Cancelado'
  const meta = getTransitionMeta(from, to)
  const fromStyle = stateConfig[from] ?? stateConfig.Abierto
  const toStyle = stateConfig[to] ?? stateConfig.Abierto
  const TransitionIcon = meta.icon

  const MIN_CHARS = 3
  const charCount = reason.trim().length
  const isValid = requiresObservation ? charCount >= MIN_CHARS : true

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  function handleConfirm() {
    if (!isValid) {
      setError(
        to === 'Cancelado'
          ? 'Debes indicar el motivo de la cancelación'
          : 'Debes indicar el motivo de la devolución',
      )
      textareaRef.current?.focus()
      return
    }
    setIsConfirming(true)
    setTimeout(() => onConfirm(reason), 150)
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setReason(e.target.value)
    if (error) setError('')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              meta.type === 'reject' ? 'bg-rose-100' : meta.type === 'return' ? 'bg-amber-100' : 'bg-primary/10'
            }`}>
              <TransitionIcon className={`w-5 h-5 ${
                meta.type === 'reject' ? 'text-rose-600' : meta.type === 'return' ? 'text-amber-600' : 'text-primary'
              }`} />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{meta.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${fromStyle.bg} ring-1 ${fromStyle.ring}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${fromStyle.icon}`} />
              <span className={`text-sm font-medium ${fromStyle.color}`}>{fromStyle.label}</span>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <ArrowRight className="w-5 h-5 text-slate-400" />
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">avanza a</span>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${toStyle.bg} ring-1 ${toStyle.ring}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${toStyle.icon}`} />
              <span className={`text-sm font-medium ${toStyle.color}`}>{toStyle.label}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Observación / Motivo
                {requiresObservation && <span className="text-rose-500 ml-0.5">*</span>}
              </label>
              {requiresObservation && (
                <span className={`text-xs tabular-nums ${
                  charCount >= MIN_CHARS ? 'text-emerald-600' : charCount > 0 ? 'text-amber-600' : 'text-slate-400'
                }`}>
                  {charCount}/{MIN_CHARS} min
                </span>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={reason}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleConfirm()
              }}
              placeholder={
                to === 'Cancelado'
                  ? 'Describe el motivo de la cancelación...'
                  : to === 'Devuelto'
                    ? 'Describe el motivo de la devolución...'
                    : 'Opcional: agrega una nota sobre este cambio...'
              }
              rows={3}
              className={`w-full px-4 py-3 border rounded-xl text-sm leading-relaxed transition-all duration-150 resize-none placeholder:text-slate-400 focus:outline-none ${
                error
                  ? 'border-rose-300 ring-2 ring-rose-200 focus:border-rose-400'
                  : 'border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20'
              }`}
            />

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!requiresObservation && (
              <p className="text-[11px] text-slate-400">
                Presiona <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Enter</kbd> para confirmar
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${meta.confirmColor}`}
          >
            {isConfirming ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </span>
            ) : (
              meta.confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
