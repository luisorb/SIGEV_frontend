import { useState } from 'react'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
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
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 hover:bg-slate-50 transition-colors ${
            showFilters ? 'ring-2 ring-primary/30 border-primary' : ''
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          Filtros
        </button>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}

        {showFilters && (
        <>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Período inicio
          </label>
          <input
            type="date"
            value={filters.periodoInicio}
            onChange={(e) => onFilterChange('periodoInicio', e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Recurso disponible
          </label>
          <SearchableSelect
            size="sm"
            className="w-44"
            options={desembolsos.map((d) => ({ value: d.id, label: d.nombre }))}
            value={filters.desembolsoId}
            onChange={(v) => onFilterChange('desembolsoId', v)}
            placeholder="Todos"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Aliado
          </label>
          <SearchableSelect
            size="sm"
            className="w-44"
            options={aliados.map((a) => ({ value: a.id, label: a.nombre }))}
            value={filters.aliadoId}
            onChange={(v) => onFilterChange('aliadoId', v)}
            placeholder="Todos"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
            Estado
          </label>
          <SearchableSelect
            size="sm"
            className="w-36"
            options={EVENT_STATES.map((s) => ({ value: s, label: s }))}
            value={filters.estado}
            onChange={(v) => onFilterChange('estado', v)}
            placeholder="Todos"
          />
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
          <SearchableSelect
            size="sm"
            className="w-44"
            options={dependencias.map((d) => ({ value: d, label: d }))}
            value={filters.dependencia}
            onChange={(v) => onFilterChange('dependencia', v)}
            placeholder="Todas"
          />
        </div>
        </>
      )}
    </div>
    </div>
  )
}
