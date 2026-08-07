import { UserCog } from 'lucide-react'

interface OperatorAssignmentProps {
  currentOperator?: string
  onAssign: (operatorName: string) => void
  readOnly?: boolean
}

const OPERATORS = [
  'Operador Logístico 1',
  'Operador Logístico 2',
  'Operador Logístico 3',
  'Operador Logístico 4',
]

export function OperatorAssignment({ currentOperator, onAssign, readOnly = false }: OperatorAssignmentProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Asignación de Operador Logístico</h2>
        </div>
      </div>
      <div className="px-6 py-4">
        {readOnly && currentOperator ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {currentOperator.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{currentOperator}</p>
              <p className="text-xs text-slate-400">Operador asignado</p>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              {currentOperator ? 'Reasignar operador' : 'Seleccionar operador logístico'}
            </label>
            <select
              value={currentOperator || ''}
              onChange={(e) => onAssign(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Seleccione un operador...</option>
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
