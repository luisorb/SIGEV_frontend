import { useState, useEffect } from 'react'
import { Plus, Pencil, X, Search } from 'lucide-react'
import type { ItemInput, Ally, TaxCategory } from '../../../types'
import { TAX_CATEGORIES } from '../../../config/constants'
import { getTariffsApi, type TariffResponse } from '../../../services/tariffs.service'

interface AddItemModalProps {
  open: boolean
  onClose: () => void
  onAdd?: (item: ItemInput) => void
  onEdit?: (id: string, updates: ItemInput) => void
  editItem?: { id: string } & ItemInput
  aliados?: Ally[]
  eventAliadoId?: string
}

const emptyItem: ItemInput = {
  nombre: '',
  descripcion: '',
  unidadMedida: '',
  cantidad: 1,
  valorUnitario: 0,
  categoriaTributaria: '' as TaxCategory,
  aliadoId: undefined,
  tariffId: undefined,
  isTariffed: false,
}

const taxCategoryLabels: Record<TaxCategory, string> = {
  IVA: 'IVA (19%)',
  Consumo: 'Consumo (8%)',
  Tercero: 'Tercero (0%)',
  Reembolso: 'Reembolso (0%)',
}

export function AddItemModal({ open, onClose, onAdd, onEdit, editItem, aliados }: AddItemModalProps) {
  if (!open) return null
  return (
    <AddItemModalContent
      key={editItem?.id ?? 'new'}
      initialItem={editItem ?? emptyItem}
      isEditing={!!editItem}
      aliados={aliados}
      onCancel={onClose}
      onSubmit={(data) => {
        if (editItem && onEdit) onEdit(editItem.id, data)
        else if (onAdd) onAdd(data)
        onClose()
      }}
    />
  )
}

interface AddItemModalContentProps {
  initialItem: ItemInput
  isEditing: boolean
  aliados?: Ally[]
  onCancel: () => void
  onSubmit: (data: ItemInput) => void
}

function AddItemModalContent({ initialItem, isEditing, aliados, onCancel, onSubmit }: AddItemModalContentProps) {
  const [form, setForm] = useState<ItemInput>(initialItem)
  const [errors, setErrors] = useState<Partial<Record<keyof ItemInput, string>>>({})
  const [tariffs, setTariffs] = useState<TariffResponse[]>([])
  const [tariffSearch, setTariffSearch] = useState('')
  const [loadingTariffs, setLoadingTariffs] = useState(false)
  const [showTariffList, setShowTariffList] = useState(false)

  async function loadTariffs() {
    setLoadingTariffs(true)
    try {
      const data = await getTariffsApi({ tariffType: 'TARIFADO', vigencyYear: 2026 })
      setTariffs(data)
    } catch {
      setTariffs([])
    } finally {
      setLoadingTariffs(false)
    }
  }

  useEffect(() => {
    if (form.isTariffed) {
      void (async () => {
        await loadTariffs()
      })()
    }
  }, [form.isTariffed])

  function validate(): boolean {
    const errs: Partial<Record<keyof ItemInput, string>> = {}
    if (!form.descripcion.trim()) errs.descripcion = 'La descripción es obligatoria'
    if (!form.isTariffed && !form.nombre?.trim()) errs.nombre = 'El nombre del servicio es obligatorio'
    if (form.cantidad < 1) errs.cantidad = 'Debe ser mayor a 0'
    if (form.isTariffed && !form.tariffId) errs.tariffId = 'Seleccione un servicio del tarifario'
    if (!form.categoriaTributaria) errs.categoriaTributaria = 'Seleccione una categoría'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const data: ItemInput = {
      ...form,
      nombre: form.nombre?.trim() ?? '',
      descripcion: form.descripcion.trim(),
      aliadoId: form.aliadoId || undefined,
      tariffId: form.tariffId || undefined,
      isTariffed: form.isTariffed || false,
      unidadMedida: form.unidadMedida || undefined,
    }
    onSubmit(data)
  }

  function handleClose() {
    onCancel()
  }

  function update<K extends keyof ItemInput>(key: K, value: ItemInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function selectTariff(tariff: TariffResponse) {
    setForm((prev) => ({
      ...prev,
      tariffId: tariff.id,
      nombre: tariff.name,
      descripcion: tariff.description ?? '',
      unidadMedida: tariff.unitMeasure ?? prev.unidadMedida,
      isTariffed: true,
    }))
    setShowTariffList(false)
    setTariffSearch('')
    if (errors.tariffId) setErrors((prev) => ({ ...prev, tariffId: undefined }))
  }

  const filteredTariffs = tariffSearch
    ? tariffs.filter(t =>
        t.name.toLowerCase().includes(tariffSearch.toLowerCase()) ||
        (t.code && t.code.toLowerCase().includes(tariffSearch.toLowerCase()))
      )
    : tariffs

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-[scaleIn_200ms_ease-out] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isEditing ? <Pencil className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{isEditing ? 'Editar Ítem' : 'Añadir Ítem'}</h3>
              <p className="text-xs text-slate-500">{isEditing ? 'Modifica los campos del ítem' : 'Completa los campos del nuevo ítem'}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Ítem</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!form.isTariffed}
                  onChange={() => {
                    update('isTariffed', false)
                    update('tariffId', undefined)
                  }}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700">No Tarifado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={form.isTariffed === true}
                  onChange={() => update('isTariffed', true)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700">Tarifado</span>
              </label>
            </div>
          </div>

          {form.isTariffed && (
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Servicio del Tarifario</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTariffList(!showTariffList)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between ${errors.tariffId ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                >
                  <span className={form.tariffId ? 'text-slate-900' : 'text-slate-400'}>
                    {form.tariffId ? tariffs.find(t => t.id === form.tariffId)?.name ?? 'Servicio seleccionado' : 'Buscar servicio...'}
                  </span>
                  <Search className="w-4 h-4 text-slate-400" />
                </button>
                {showTariffList && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-slate-100">
                      <input
                        type="text"
                        value={tariffSearch}
                        onChange={(e) => setTariffSearch(e.target.value)}
                        placeholder="Buscar por nombre o código..."
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    {loadingTariffs ? (
                      <div className="p-3 text-sm text-slate-500 text-center">Cargando...</div>
                    ) : filteredTariffs.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500 text-center">No se encontraron servicios</div>
                    ) : (
                      filteredTariffs.map((tariff) => (
                        <button
                          key={tariff.id}
                          type="button"
                          onClick={() => selectTariff(tariff)}
                          className="w-full px-3 py-2 text-left hover:bg-primary/5 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <div className="text-sm font-medium text-slate-900">{tariff.name}</div>
                          <div className="text-xs text-slate-500">
                            {tariff.code && `${tariff.code} · `}
                            {tariff.sheet}
                            {tariff.unitMeasure && ` · ${tariff.unitMeasure}`}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.tariffId && <p className="text-xs text-red-500 mt-1">{errors.tariffId}</p>}
            </div>
          )}

          {!form.isTariffed && (
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Servicio</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => update('nombre', e.target.value)}
                placeholder="Nombre del servicio no tarifado"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Descripción Técnica</label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder={form.isTariffed && form.tariffId ? '' : 'Descripción técnica del servicio'}
              readOnly={form.isTariffed && !!form.tariffId}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.descripcion ? 'border-red-300 bg-red-50' : 'border-slate-300'} ${form.isTariffed && form.tariffId ? 'bg-slate-50 text-slate-600' : ''}`}
            />
            {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Unidad de Medida</label>
              {form.isTariffed && form.tariffId ? (
                <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700">
                  {form.unidadMedida || <span className="text-slate-400 italic">No especificada</span>}
                </div>
              ) : (
                <input
                  type="text"
                  value={form.unidadMedida ?? ''}
                  onChange={(e) => update('unidadMedida', e.target.value || undefined)}
                  placeholder="Ej: Unidad, Día, Trayecto..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Cantidad</label>
              <input
                type="number"
                step={1}
                min={1}
                value={form.cantidad}
                onChange={(e) => update('cantidad', e.target.valueAsNumber || 1)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.cantidad ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.cantidad && <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Valor Unitario</label>
              <div className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500">
                <span className="italic">Pendiente por cotizar</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Categoría Tributaria</label>
              <select
                value={form.categoriaTributaria}
                onChange={(e) => update('categoriaTributaria', e.target.value as TaxCategory)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.categoriaTributaria ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              >
                <option value="">Seleccione</option>
                {TAX_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{taxCategoryLabels[cat]}</option>
                ))}
              </select>
              {errors.categoriaTributaria && <p className="text-xs text-red-500 mt-1">{errors.categoriaTributaria}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Aliado Específico (Opcional)</label>
            <select
              value={form.aliadoId ?? ''}
              onChange={(e) => update('aliadoId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Usar aliado general del evento</option>
              {aliados?.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
            >
              {isEditing ? 'Guardar cambios' : 'Aceptar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
