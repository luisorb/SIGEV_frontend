import { useState, useMemo } from 'react'
import { getAllAuditEntries } from '../lib/auditStore'
import { formatDateCO } from '../utils/formatters'

const ENTIDADES = ['', 'Event', 'Offer', 'Item', 'Ally', 'User', 'Param']
const ACCIONES = ['', 'Creación', 'Actualización', 'Eliminación', 'Cambio de estado']

export function AuditPage() {
  const [filterEntidad, setFilterEntidad] = useState('')
  const [filterAccion, setFilterAccion] = useState('')

  const entries = useMemo(() => {
    let result = getAllAuditEntries()
    if (filterEntidad) result = result.filter((e) => e.entidad === filterEntidad)
    if (filterAccion) result = result.filter((e) => e.accion.startsWith(filterAccion))
    return result
  }, [filterEntidad, filterAccion])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-500">Registro de actividades y trazabilidad del sistema</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterEntidad}
          onChange={(e) => setFilterEntidad(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las entidades</option>
          {ENTIDADES.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
          value={filterAccion}
          onChange={(e) => setFilterAccion(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las acciones</option>
          {ACCIONES.filter(Boolean).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Entidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    No hay registros de auditoría.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDateCO(entry.fecha)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{entry.usuario}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{entry.accion}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{entry.entidad}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{entry.entidadId}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{entry.detalle}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
