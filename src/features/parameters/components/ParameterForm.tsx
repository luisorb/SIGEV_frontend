import { Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
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
  value: number
  onChange: (value: number) => void
}

function PercentField({ label, description, value, onChange }: PercentFieldProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex-1">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="relative w-32">
        <input
          type="number"
          value={Math.round(value * 10000) / 100}
          min={0}
          max={100}
          step={0.01}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="w-full px-3 py-1.5 pr-8 border border-slate-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
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
  const percentFields: { key: ParamFieldKey; label: string; description: string }[] = [
    { key: 'ivaRate', label: 'IVA', description: 'Impuesto al Valor Agregado' },
    { key: 'impuestoConsumoRate', label: 'Impuesto al Consumo', description: 'Impuesto al consumo (ICA)' },
    { key: 'feeTarifadoRate', label: 'Fee Tarifado', description: 'Porcentaje de fee sobre la base tarifada' },
    { key: 'feeTercerosRate', label: 'Fee Terceros', description: 'Porcentaje de fee para terceros' },
    { key: 'ivaFeeRate', label: 'IVA sobre Fee', description: 'IVA aplicado sobre el fee calculado' },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Parámetros Actuales
              {activeVersion && <span className="text-slate-400 font-normal ml-1">(v{activeVersion.version})</span>}
            </h3>
            <p className="text-xs text-slate-500">
              {isDirty
                ? `Editando — se creará versión ${nextVersion} al guardar`
                : 'Sin cambios pendientes'}
            </p>
          </div>
          {saveMessage && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
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

      <div className="px-5 py-3 divide-y divide-slate-100">
        {percentFields.map((f) => (
          <PercentField
            key={f.key}
            label={f.label}
            description={f.description}
            value={editParams[f.key]}
            onChange={(v) => onUpdateParam(f.key, v)}
          />
        ))}

        <div className="flex items-center justify-between py-2.5">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">Aplicar Fee sobre Base</label>
            <p className="text-xs text-slate-400">Si está activo, el fee se calcula sobre el valor base en lugar del total con impuestos</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={editParams.applyFeeOnBase}
              onChange={(e) => onUpdateParam('applyFeeOnBase', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
          </label>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Aprobado por:</label>
            <input
              type="text"
              value={aprobadoPor}
              onChange={(e) => onAprobadoPorChange(e.target.value)}
              className="flex-1 max-w-xs px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nombre de quien aprueba"
            />
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={onDiscard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Descartar
              </button>
            )}
            <button
              onClick={onSave}
              disabled={!isDirty}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
