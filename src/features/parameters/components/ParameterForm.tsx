import { Save, RotateCcw, AlertCircle, CheckCircle2, Receipt, Percent, Banknote, Users, ShieldCheck } from 'lucide-react'
import type { CalculationParams } from '../../../types'
import type { ParamFieldKey } from '../types'

interface ParameterFormProps {
  editParams: CalculationParams
  activeVersion: { version?: number } | null
  isDirty: boolean
  nextVersion: number
  aprobadoPor: string
  saveMessage: { type: 'success' | 'error'; text: string } | null
  onUpdateParam: (key: keyof CalculationParams, value: number | boolean) => void
  onAprobadoPorChange: (value: string) => void
  onSave: () => void
  onDiscard: () => void
}

interface PercentFieldProps {
  label: string
  description: string
  icon: React.ReactNode
  value: number
  onChange: (value: number) => void
}

function PercentField({ label, description, icon, value, onChange }: PercentFieldProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 rounded-lg hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-1.5 rounded-lg bg-primary/5 text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-700 truncate">{label}</label>
          <p className="text-xs text-slate-400 truncate">{description}</p>
        </div>
      </div>
      <div className="relative w-28 shrink-0">
        <input
          type="number"
          value={value * 100}
          min={0}
          max={100}
          step="any"
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '' || raw === '-') return
            onChange(Math.round(parseFloat(raw) * 100) / 100 / 100)
          }}
          className="w-full px-3 py-1.5 pr-8 border border-slate-200 rounded-lg text-sm text-right font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">%</span>
      </div>
    </div>
  )
}

export function ParameterForm({
  editParams,
  activeVersion,
  isDirty,
  nextVersion,
  aprobadoPor,
  saveMessage,
  onUpdateParam,
  onAprobadoPorChange,
  onSave,
  onDiscard,
}: ParameterFormProps) {
  const impuestos: { key: ParamFieldKey; label: string; description: string; icon: React.ReactNode }[] = [
    { key: 'ivaRate', label: 'IVA', description: 'Impuesto al Valor Agregado', icon: <Receipt className="w-3.5 h-3.5" /> },
    { key: 'impuestoConsumoRate', label: 'Impuesto al Consumo', description: 'Impuesto al consumo (ICA)', icon: <Percent className="w-3.5 h-3.5" /> },
    { key: 'ivaFeeRate', label: 'IVA sobre Fee', description: 'IVA aplicado sobre el fee calculado', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ]

  const comisiones: { key: ParamFieldKey; label: string; description: string; icon: React.ReactNode }[] = [
    { key: 'feeTarifadoRate', label: 'Fee Tarifado', description: 'Porcentaje de fee sobre la base tarifada', icon: <Banknote className="w-3.5 h-3.5" /> },
    { key: 'feeTercerosRate', label: 'Fee Terceros', description: 'Porcentaje de fee para terceros', icon: <Users className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Parámetros Actuales
              </h3>
              {activeVersion && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  v{activeVersion.version}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDirty
                ? `Editando — se creará versión ${nextVersion} al guardar`
                : 'Sin cambios pendientes'}
            </p>
          </div>
          {saveMessage && (
            <div
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium animate-[slideInUp_200ms_ease-out] ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {saveMessage.type === 'success'
                ? <CheckCircle2 className="w-3.5 h-3.5" />
                : <AlertCircle className="w-3.5 h-3.5" />
              }
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Impuestos Fiscales</span>
            <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
          </div>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white">
            {impuestos.map((f) => (
              <PercentField
                key={f.key}
                label={f.label}
                description={f.description}
                icon={f.icon}
                value={editParams[f.key]}
                onChange={(v) => onUpdateParam(f.key, v)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Comisiones</span>
            <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
          </div>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white">
            {comisiones.map((f) => (
              <PercentField
                key={f.key}
                label={f.label}
                description={f.description}
                icon={f.icon}
                value={editParams[f.key]}
                onChange={(v) => onUpdateParam(f.key, v)}
              />
            ))}
            <div className="flex items-center justify-between py-2.5 px-4 rounded-lg hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/5 text-primary shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-slate-700">Aplicar Fee sobre Base</label>
                  <p className="text-xs text-slate-400">El fee se calcula sobre el valor base en lugar del total con impuestos</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={editParams.applyFeeOnBase}
                  onChange={(e) => onUpdateParam('applyFeeOnBase', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 rounded-b-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Aprobado por:</label>
            <input
              type="text"
              value={aprobadoPor}
              onChange={(e) => onAprobadoPorChange(e.target.value)}
              className="w-full sm:w-56 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Nombre de quien aprueba"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isDirty && (
              <button
                onClick={onDiscard}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Descartar
              </button>
            )}
            <button
              onClick={onSave}
              disabled={!isDirty}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
