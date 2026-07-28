import { Clock, ArrowLeftToLine, Check } from 'lucide-react'
import type { ParamVersion } from '../types'
import { formatDateCO } from '../../../utils/formatters'

interface ParameterHistoryTableProps {
  versions: ParamVersion[]
  activeVersionId: string | null
  onLoadVersion: (id: string) => void
}

export function ParameterHistoryTable({ versions, activeVersionId, onLoadVersion }: ParameterHistoryTableProps) {
  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No hay versiones registradas</p>
      </div>
    )
  }

  const sorted = [...versions].sort((a, b) => b.version - a.version)

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Historial de Versiones</h3>
        <p className="text-xs text-slate-500">{versions.length} versión{versions.length !== 1 ? 'es' : ''} registrada{versions.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Versión</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Aprobado por</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">IVA</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Consumo</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Tarif.</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee 3ros</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">IVA Fee</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((v) => {
              const isActive = v.id === activeVersionId
              return (
                <tr
                  key={v.id}
                  className={`hover:bg-slate-50 transition-colors ${isActive ? 'bg-red-50/50' : ''}`}
                >
                  <td className="px-4 py-2.5">
                    <span className={`font-mono text-sm font-medium ${isActive ? 'text-red-700' : 'text-slate-900'}`}>
                      v{v.version}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">
                    {formatDateCO(v.fechaCreacion)}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{v.aprobadoPor}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{(v.params.ivaRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{(v.params.impuestoConsumoRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{(v.params.feeTarifadoRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{(v.params.feeTercerosRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-sm text-slate-600">{(v.params.ivaFeeRate * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Check className="w-3 h-3" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                        Anterior
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onLoadVersion(v.id)}
                      disabled={isActive}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Cargar esta versión en el formulario"
                    >
                      <ArrowLeftToLine className="w-3 h-3" />
                      Cargar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
