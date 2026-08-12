import { Save, RotateCcw, AlertCircle, CheckCircle2, Receipt, Percent, Banknote, Users, ShieldCheck, Loader2 } from 'lucide-react'
import type { CalculationParams } from '../../../types'
import type { ParamFieldKey } from '../types'

interface ParameterFormProps {
  editParams: CalculationParams
  activeVersion: { version?: number; fechaInicio?: string; fechaFin?: string } | null
  isDirty: boolean
  nextVersion: number
  aprobadoPor: string
  vigenciaInicio: string
  vigenciaFin: string
  saveMessage: { type: 'success' | 'error'; text: string } | null
  saving?: boolean
  onUpdateParam: (key: keyof CalculationParams, value: number | boolean) => void
  onAprobadoPorChange: (value: string) => void
  onVigenciaInicioChange: (value: string) => void
  onVigenciaFinChange: (value: string) => void
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
    <div className="flex items-center justify-between py-2.5 px-3 sm:px-4 rounded-lg hover:bg-slate-50/50 transition-colors gap-2">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="p-1.5 rounded-lg bg-primary/5 text-primary shrink-0 hidden sm:block">
          {icon}
        </div>
        <div className="min-w-0">
          <label className="block text-sm font-medium text-slate-700 truncate">{label}</label>
          <p className="text-xs text-slate-400 truncate hidden sm:block">{description}</p>
        </div>
      </div>
      <div className="relative w-24 sm:w-28 shrink-0">
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
          className="w-full px-2 sm:px-3 py-1.5 pr-7 sm:pr-8 border border-slate-200 rounded-lg text-sm text-right font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">%</span>
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
  vigenciaInicio,
  vigenciaFin,
  saveMessage,
  saving,
  onUpdateParam,
  onAprobadoPorChange,
  onVigenciaInicioChange,
  onVigenciaFinChange,
  onSave,
  onDiscard,
}: ParameterFormProps) {
  const impuestos: { key: ParamFieldKey; label: string; description: string; icon: React.ReactNode }[] = [
    { key: 'ivaRate', label: 'IVA', description: 'Impuesto al Valor Agregado', icon: <Receipt className="w-3.5 h-3.5" /> },
    { key: 'impuestoConsumoRate', label: 'Impuesto a consumo (INC)', description: 'Impuesto a consumo (INC)', icon: <Percent className="w-3.5 h-3.5" /> },
    { key: 'ivaFeeRate', label: 'IVA sobre FEE', description: 'IVA aplicado sobre el FEE calculado', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ]

  const comisiones: { key: ParamFieldKey; label: string; description: string; icon: React.ReactNode }[] = [
    { key: 'feeTarifadoRate', label: 'FEE Tarifado', description: 'Porcentaje de FEE sobre la base tarifada', icon: <Banknote className="w-3.5 h-3.5" /> },
    { key: 'feeTercerosRate', label: 'FEE Terceros', description: 'Porcentaje de FEE para terceros', icon: <Users className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
              className={`w-full sm:w-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium animate-[slideInUp_200ms_ease-out] ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {saveMessage.type === 'success'
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              }
              <span className="truncate">{saveMessage.text}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Impuestos Fiscales</span>
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
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Comisiones</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3 sm:px-4 rounded-lg hover:bg-slate-50/50 transition-colors gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/5 text-primary shrink-0 hidden sm:block">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-slate-700">Aplicar FEE sobre Base</label>
                  <p className="text-xs text-slate-400">El fee se calcula sobre el valor base en lugar del total con impuestos</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 self-end sm:self-auto">
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

      <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50/80 rounded-b-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Vigencia inicio</label>
            <input
              type="date"
              value={vigenciaInicio}
              onChange={(e) => onVigenciaInicioChange(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Vigencia fin</label>
            <input
              type="date"
              value={vigenciaFin}
              onChange={(e) => onVigenciaFinChange(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex flex-col justify-center gap-1 sm:col-span-2 lg:col-span-2">
            <span className="text-xs text-slate-500">
              {activeVersion?.version ? `Vigencia actual: v${activeVersion.version}` : 'Sin versión vigente'}
              {activeVersion?.fechaInicio ? ` (${String(activeVersion.fechaInicio).slice(0, 10)}${activeVersion.fechaFin ? ` a ${String(activeVersion.fechaFin).slice(0, 10)}` : ''})` : ''}
            </span>
            {!vigenciaInicio && (
              <span className="text-xs text-amber-600">La fecha de inicio es obligatoria para guardar una nueva versión.</span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
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
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Descartar
              </button>
            )}
            <button
              onClick={onSave}
              disabled={!isDirty || saving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
