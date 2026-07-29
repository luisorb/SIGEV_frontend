import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

let nextToastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++nextToastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  function dismiss(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3
              bg-white rounded-xl shadow-xl border
              animate-[slideInUp_250ms_ease-out] min-w-[320px] max-w-sm
              ${toast.type === 'success'
                ? 'border-green-200 border-l-4 border-l-green-500'
                : 'border-red-200 border-l-4 border-l-red-500'
              }
            `}
          >
            <div className="flex items-start gap-3 px-4 py-3.5 flex-1 min-w-0">
              {toast.type === 'success' ? (
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
              )}
              <p className={`text-sm font-medium flex-1 leading-5 ${
                toast.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 p-3 hover:bg-black/[0.04] transition-colors self-stretch flex items-center"
            >
              <X className={`w-4 h-4 ${
                toast.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
