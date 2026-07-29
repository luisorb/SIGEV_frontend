import { useState } from 'react'
import { Settings, Handshake, Banknote, Calculator, Plus, Search, Pencil, Power, PowerOff } from 'lucide-react'
import { useParameters } from '../hooks/useParameters'
import { ParameterForm } from '../components/ParameterForm'
import { ParameterHistoryTable } from '../components/ParameterHistoryTable'
import { useAliados, useDesembolsos } from '../../../lib/catalogStore'
import { formatCurrencyCO, formatDateCO } from '../../../utils/formatters'
import type { Ally, Disbursement } from '../../../types'

type Tab = 'tasas' | 'aliados' | 'desembolsos'

type AllyForm = Omit<Ally, 'id'>
const EMPTY_ALLY: AllyForm = { nombre: '', nit: '', contacto: '', email: '', telefono: '', color: '#3B82F6', activo: true }

type DesForm = Omit<Disbursement, 'id'>
const EMPTY_DES: DesForm = { nombre: '', codigo: '', porcentajeParticipacion: 0, vigencia: '', valorReferencia: 0, activo: true }

function AliadosTab() {
  const { aliados, addAliado, updateAliado, toggleActivo } = useAliados()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ally | null>(null)
  const [form, setForm] = useState<AllyForm>(EMPTY_ALLY)
  const [error, setError] = useState('')

  const filtered = aliados.filter((a) =>
    !search || a.nombre.toLowerCase().includes(search.toLowerCase()) || a.nit.includes(search)
  )

  function openCreate() { setEditing(null); setForm(EMPTY_ALLY); setError(''); setModalOpen(true) }

  function openEdit(a: Ally) { setEditing(a); setForm({ nombre: a.nombre, nit: a.nit, contacto: a.contacto, email: a.email, telefono: a.telefono, color: a.color, activo: a.activo }); setError(''); setModalOpen(true) }

  function handleSave() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.nit.trim()) { setError('El NIT es obligatorio'); return }
    setError('')
    if (editing) updateAliado(editing.id, form); else addAliado(form)
    setModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{aliados.length} registros</p>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150">
          <Plus className="w-4 h-4" /> Nuevo Aliado
        </button>
      </div>
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre o NIT..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">NIT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">No hay aliados registrados</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${!a.activo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: a.color }} />
                        <span className="font-medium text-slate-900">{a.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.nit}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.contacto} · {a.email} · {a.telefono}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${a.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => toggleActivo(a.id)} className={`p-1.5 rounded-lg transition-colors ${a.activo ? 'hover:bg-red-50 text-slate-500 hover:text-red-600' : 'hover:bg-green-50 text-slate-500 hover:text-green-600'}`} title={a.activo ? 'Inactivar' : 'Activar'}>{a.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">{editing ? 'Editar Aliado' : 'Nuevo Aliado'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">NIT <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Contacto</label>
                  <input type="text" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                  <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Color</label>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-9 px-1 border border-slate-300 rounded-lg cursor-pointer" />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">{editing ? 'Guardar' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DesembolsosTab() {
  const { desembolsos, addDesembolso, updateDesembolso, toggleActivo } = useDesembolsos()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Disbursement | null>(null)
  const [form, setForm] = useState<DesForm>(EMPTY_DES)
  const [error, setError] = useState('')

  const filtered = desembolsos.filter((d) =>
    !search || d.nombre.toLowerCase().includes(search.toLowerCase()) || d.codigo.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setEditing(null); setForm(EMPTY_DES); setError(''); setModalOpen(true) }

  function openEdit(d: Disbursement) { setEditing(d); setForm({ nombre: d.nombre, codigo: d.codigo, porcentajeParticipacion: d.porcentajeParticipacion, vigencia: d.vigencia, valorReferencia: d.valorReferencia, activo: d.activo }); setError(''); setModalOpen(true) }

  function handleSave() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.codigo.trim()) { setError('El código es obligatorio'); return }
    if (!form.vigencia) { setError('La vigencia es obligatoria'); return }
    if (form.valorReferencia <= 0) { setError('El valor de referencia debe ser mayor a 0'); return }
    setError('')
    if (editing) updateDesembolso(editing.id, form); else addDesembolso(form)
    setModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{desembolsos.length} registros</p>
        <button onClick={openCreate} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150">
          <Plus className="w-4 h-4" /> Nuevo Desembolso
        </button>
      </div>
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vigencia</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">% Participación</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Referencia</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No hay desembolsos registrados</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className={`hover:bg-slate-50 transition-colors ${!d.activo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-900">{d.codigo}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{d.nombre}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{d.vigencia ? formatDateCO(d.vigencia) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600">{d.porcentajeParticipacion}%</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{formatCurrencyCO(d.valorReferencia)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${d.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{d.activo ? 'Activo' : 'Inactivo'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => toggleActivo(d.id)} className={`p-1.5 rounded-lg transition-colors ${d.activo ? 'hover:bg-red-50 text-slate-500 hover:text-red-600' : 'hover:bg-green-50 text-slate-500 hover:text-green-600'}`} title={d.activo ? 'Inactivar' : 'Activar'}>{d.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4">{editing ? 'Editar Desembolso' : 'Nuevo Desembolso'}</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Código <span className="text-red-500">*</span></label>
                  <input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Nombre <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Vigencia <span className="text-red-500">*</span></label>
                  <input type="date" value={form.vigencia} onChange={(e) => setForm({ ...form, vigencia: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">% Participación</label>
                  <input type="number" min={0} max={100} value={form.porcentajeParticipacion} onChange={(e) => setForm({ ...form, porcentajeParticipacion: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Valor de Referencia <span className="text-red-500">*</span></label>
                <input type="number" min={0} step={1000} value={form.valorReferencia} onChange={(e) => setForm({ ...form, valorReferencia: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors">{editing ? 'Guardar' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const TABS: { key: Tab; label: string; icon: typeof Calculator }[] = [
  { key: 'tasas', label: 'Tasas de Cálculo', icon: Calculator },
  { key: 'aliados', label: 'Aliados', icon: Handshake },
  { key: 'desembolsos', label: 'Desembolsos', icon: Banknote },
]

export function ParametersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tasas')

  const {
    editParams,
    updateParam,
    versions,
    activeVersion,
    isDirty,
    nextVersion,
    aprobadoPor,
    setAprobadoPor,
    saveNewVersion,
    loadVersion,
    discardChanges,
    saveMessage,
  } = useParameters()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900">Parámetros del Sistema</h1>
        </div>
        <p className="text-sm text-slate-500">
          Gestión de tasas, aliados, desembolsos y catálogos maestros del sistema.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'tasas' && (
        <>
          <ParameterForm
            editParams={editParams}
            activeVersion={activeVersion ? { version: activeVersion.version } : null}
            isDirty={isDirty}
            nextVersion={nextVersion}
            aprobadoPor={aprobadoPor}
            saveMessage={saveMessage}
            onUpdateParam={updateParam}
            onAprobadoPorChange={setAprobadoPor}
            onSave={saveNewVersion}
            onDiscard={discardChanges}
          />
          <ParameterHistoryTable
            versions={versions}
            activeVersionId={activeVersion?.id ?? null}
            onLoadVersion={loadVersion}
          />
        </>
      )}

      {activeTab === 'aliados' && <AliadosTab />}
      {activeTab === 'desembolsos' && <DesembolsosTab />}
    </div>
  )
}
