import { RotateCcw } from 'lucide-react'
import type { DashboardFiltersState } from '../types'
import type { Ally, Disbursement, Municipality } from '../../../types'
import { EVENT_STATES } from '../../../config/constants'
import { SearchableSelect } from '../../../components/SearchableSelect'

interface DashboardFiltersProps {
  filters: DashboardFiltersState
  aliados: Ally[]
  desembolsos: Disbursement[]
  municipios: Municipality[]
  dependencias: string[]
  hasActiveFilters: boolean
  onFilterChange: (key: keyof DashboardFiltersState, value: string) => void
  onReset: () => void
}

export function DashboardFilters({
  filters,
  aliados,
  desembolsos,
  municipios,
  dependencias,
  hasActiveFilters,
  onFilterChange,
  onReset,
}: DashboardFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Período inicio
          </label>
          <input
            type="date"
            value={filters.periodoInicio}
            onChange={(e) => onFilterChange('periodoInicio', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Período fin
          </label>
          <input
            type="date"
            value={filters.periodoFin}
            onChange={(e) => onFilterChange('periodoFin', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Desembolso
          </label>
          <select
            value={filters.desembolsoId}
            onChange={(e) => onFilterChange('desembolsoId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            {desembolsos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Aliado
          </label>
          <select
            value={filters.aliadoId}
            onChange={(e) => onFilterChange('aliadoId', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            {aliados.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Estado
          </label>
          <select
            value={filters.estado}
            onChange={(e) => onFilterChange('estado', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            {EVENT_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Municipio
          </label>
          <SearchableSelect
            size="sm"
            className="w-56"
            options={municipios.map((m) => ({
              value: m.id,
              label: `${m.nombre} (${m.departamento})`,
              keywords: `${m.nombre} ${m.departamento}`,
            }))}
            value={filters.municipioId ?? ''}
            onChange={(v) => onFilterChange('municipioId', v)}
            placeholder="Todos"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Dependencia
          </label>
          <select
            value={filters.dependencia}
            onChange={(e) => onFilterChange('dependencia', e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todas</option>
            {dependencias.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
