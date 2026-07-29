import { useState } from 'react'
import { Settings, Handshake, Banknote, Calculator, Plus, Search, Pencil, Power, PowerOff, Clock, X } from 'lucide-react'
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

const inputBase = [
  'w-full px-3 py-2.5',
  'border border-slate-300 rounded-lg',
  'text-sm text-slate-900',
  'bg-white',
  'placeholder:text-slate-400',
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
  'transition-shadow duration-150',
].join(' ')

const inputError = 'border-red-300 focus:ring-red-300/40 focus:border-red-400'
const labelBase = 'block text-sm font-medium text-slate-700'
const requiredMark = <span className="text-red-400 ml-0.5">*</span>

function AliadosTab() {
  const { aliados, addAliado, updateAliado, toggleActivo } = useAliados()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Ally | null>(null)
  const [form, setForm] = useState<AllyForm>(EMPTY_ALLY)
  const [errors, setErrors] = useState<Partial<Record<keyof AllyForm, string>>>({})

  const filtered = aliados.filter((a) =>
    !search || a.nombre.toLowerCase().includes(search.toLowerCase()) || a.nit.includes(search)
  )

  function openCreate() { setEditing(null); setForm(EMPTY_ALLY); setErrors({}); setModalOpen(true) }

  function openEdit(a: Ally) { setEditing(a); setForm({ nombre: a.nombre, nit: a.nit, contacto: a.contacto, email: a.email, telefono: a.telefono, color: a.color, activo: a.activo }); setErrors({}); setModalOpen(true) }

  function handleSave() {
    const newErrors: Partial<Record<keyof AllyForm, string>> = {}
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!form.nit.trim()) newErrors.nit = 'El NIT es obligatorio'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    if (editing) updateAliado(editing.id, form); else addAliado(form)
    setModalOpen(false)
  }

  function inp(field: keyof AllyForm) {
    return errors[field] ? inputBase + ' ' + inputError : inputBase
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-[scaleIn_200ms_ease-out]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Handshake className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{editing ? 'Editar Aliado' : 'Nuevo Aliado'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelBase}>Nombre {requiredMark}</label>
                  <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' })) }} placeholder="Ej: Aliado SAS" className={inp('nombre')} />
                  {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelBase}>NIT {requiredMark}</label>
                  <input type="text" value={form.nit} onChange={(e) => { setForm({ ...form, nit: e.target.value }); if (errors.nit) setErrors((prev) => ({ ...prev, nit: '' })) }} placeholder="Ej: 900.123.456-7" className={inp('nit')} />
                  {errors.nit && <p className="text-xs text-red-500">{errors.nit}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelBase}>Contacto</label>
                  <input type="text" value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} placeholder="Nombre del contacto" className={inputBase} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelBase}>Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contacto@ejemplo.com" className={inputBase} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelBase}>Teléfono</label>
                  <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: +57 300 000 0000" className={inputBase} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelBase}>Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-10 h-9 px-0.5 border border-slate-300 rounded-lg cursor-pointer" />
                    <span className="text-xs text-slate-500 font-mono">{form.color}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-150">{editing ? 'Guardar Cambios' : 'Crear Aliado'}</button>
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
  const [errors, setErrors] = useState<Partial<Record<keyof DesForm, string>>>({})

  const filtered = desembolsos.filter((d) =>
    !search || d.nombre.toLowerCase().includes(search.toLowerCase()) || d.codigo.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() { setEditing(null); setForm(EMPTY_DES); setErrors({}); setModalOpen(true) }

  function openEdit(d: Disbursement) { setEditing(d); setForm({ nombre: d.nombre, codigo: d.codigo, porcentajeParticipacion: d.porcentajeParticipacion, vigencia: d.vigencia, valorReferencia: d.valorReferencia, activo: d.activo }); setErrors({}); setModalOpen(true) }

  function handleSave() {
    const newErrors: Partial<Record<keyof DesForm, string>> = {}
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio'
    if (!form.codigo.trim()) newErrors.codigo = 'El código es obligatorio'
    if (!form.vigencia) newErrors.vigencia = 'La vigencia es obligatoria'
    if (form.valorReferencia <= 0) newErrors.valorReferencia = 'El valor de referencia debe ser mayor a 0'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    if (editing) updateDesembolso(editing.id, form); else addDesembolso(form)
    setModalOpen(false)
  }

  function inp(field: keyof DesForm) {
    return errors[field] ? inputBase + ' ' + inputError : inputBase
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-[scaleIn_200ms_ease-out]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Banknote className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{editing ? 'Editar Desembolso' : 'Nuevo Desembolso'}</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelBase}>Código {requiredMark}</label>
                  <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); if (errors.codigo) setErrors((prev) => ({ ...prev, codigo: '' })) }} placeholder="Ej: DES-001" className={inp('codigo')} />
                  {errors.codigo && <p className="text-xs text-red-500">{errors.codigo}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelBase}>Nombre {requiredMark}</label>
                  <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' })) }} placeholder="Ej: Desembolso Tipo A" className={inp('nombre')} />
                  {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={labelBase}>Vigencia {requiredMark}</label>
                  <input type="date" value={form.vigencia} onChange={(e) => { setForm({ ...form, vigencia: e.target.value }); if (errors.vigencia) setErrors((prev) => ({ ...prev, vigencia: '' })) }} className={inp('vigencia')} />
                  {errors.vigencia && <p className="text-xs text-red-500">{errors.vigencia}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className={labelBase}>% Participación</label>
                  <input type="number" min={0} max={100} value={form.porcentajeParticipacion} onChange={(e) => setForm({ ...form, porcentajeParticipacion: Number(e.target.value) })} className={inputBase} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelBase}>Valor de Referencia {requiredMark}</label>
                <input type="number" min={0} step={1000} value={form.valorReferencia} onChange={(e) => { setForm({ ...form, valorReferencia: Number(e.target.value) }); if (errors.valorReferencia) setErrors((prev) => ({ ...prev, valorReferencia: '' })) }} placeholder="Ej: 1000000" className={inp('valorReferencia')} />
                {errors.valorReferencia && <p className="text-xs text-red-500">{errors.valorReferencia}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-150">{editing ? 'Guardar Cambios' : 'Crear Desembolso'}</button>
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
  const [historialOpen, setHistorialOpen] = useState(false)

  const {
    editParams,
    updateParam,
    versions,
    currentVersion,
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
            activeVersion={currentVersion ? { version: currentVersion.version } : null}
            isDirty={isDirty}
            nextVersion={nextVersion}
            aprobadoPor={aprobadoPor}
            saveMessage={saveMessage}
            onUpdateParam={updateParam}
            onAprobadoPorChange={setAprobadoPor}
            onSave={saveNewVersion}
            onDiscard={discardChanges}
          />
          <div className="flex justify-center">
            <button
              onClick={() => setHistorialOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
            >
              <Clock className="w-4 h-4" />
              Ver Historial de Versiones ({versions.length})
            </button>
          </div>
          {historialOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full animate-[scaleIn_200ms_ease-out]">
                <ParameterHistoryTable
                  versions={versions}
                  currentVersionId={currentVersion?.id ?? null}
                  onLoadVersion={(id) => { loadVersion(id); setHistorialOpen(false) }}
                />
                <div className="flex justify-end px-5 py-3 border-t border-slate-200">
                  <button
                    onClick={() => setHistorialOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'aliados' && <AliadosTab />}
      {activeTab === 'desembolsos' && <DesembolsosTab />}
    </div>
  )
}
