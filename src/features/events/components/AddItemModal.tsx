import { useState, useEffect } from 'react'
import { Plus, Pencil, X, Search, CheckCircle2, Tag, PenLine, Info, Check } from 'lucide-react'
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
    if (!form.isTariffed && !form.descripcion.trim()) errs.descripcion = 'La descripción es obligatoria'
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

  function setType(tariffed: boolean) {
    setForm({ ...emptyItem, isTariffed: tariffed })
    setErrors({})
    setShowTariffList(false)
    setTariffSearch('')
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

  const selectedTariff = form.tariffId ? tariffs.find((t) => t.id === form.tariffId) : undefined
  const total = form.cantidad * (form.valorUnitario ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-[scaleIn_200ms_ease-out] max-h-[90vh] overflow-y-auto"
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
          <button type="button" onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipo de ítem</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType(false)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                  !form.isTariffed
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 ${!form.isTariffed ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <PenLine className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${!form.isTariffed ? 'text-primary' : 'text-slate-700'}`}>No tarifado</span>
                  <span className="block text-[11px] text-slate-500 whitespace-nowrap leading-tight">Servicio libre que registras manualmente</span>
                </span>
                {!form.isTariffed && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
              </button>
              <button
                type="button"
                onClick={() => setType(true)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                  form.isTariffed
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 ${form.isTariffed ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <Tag className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${form.isTariffed ? 'text-primary' : 'text-slate-700'}`}>Tarifado</span>
                  <span className="block text-[11px] text-slate-500 whitespace-nowrap leading-tight">Servicio seleccionado del tarifario</span>
                </span>
                {form.isTariffed && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
              </button>
            </div>
          </div>

          {form.isTariffed ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Servicio del tarifario</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTariffList(!showTariffList)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-left flex items-center justify-between gap-2 transition-colors ${
                    errors.tariffId
                      ? 'border-red-300 bg-red-50'
                      : form.tariffId
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span className={`truncate ${form.tariffId ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {selectedTariff ? selectedTariff.name : 'Buscar servicio del tarifario...'}
                  </span>
                  {form.tariffId ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {showTariffList && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
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
                      filteredTariffs.map((tariff) => {
                        const isSelected = tariff.id === form.tariffId
                        return (
                          <button
                            key={tariff.id}
                            type="button"
                            onClick={() => selectTariff(tariff)}
                            className={`w-full px-3 py-2 text-left transition-colors border-b border-slate-50 last:border-0 ${
                              isSelected ? 'bg-primary/10' : 'hover:bg-primary/5'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-slate-900 truncate">{tariff.name}</span>
                              {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </div>
                            <div className="text-xs text-slate-500">
                              {tariff.code && `${tariff.code} · `}
                              {tariff.sheet}
                              {tariff.unitMeasure && ` · ${tariff.unitMeasure}`}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
              {errors.tariffId && <p className="text-xs text-red-500 mt-1">{errors.tariffId}</p>}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Servicio <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => update('nombre', e.target.value)}
                placeholder="Nombre del servicio no tarifado"
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Descripción técnica {!form.isTariffed && <span className="text-primary">*</span>}
            </label>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder={form.isTariffed ? 'Se completará con el servicio seleccionado del tarifario' : 'Describe el servicio o bien a incluir en la orden'}
              readOnly={form.isTariffed}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                errors.descripcion && !form.isTariffed ? 'border-red-300 bg-red-50' : 'border-slate-300'
              } ${form.isTariffed ? 'bg-slate-50 text-slate-600' : ''}`}
            />
            {errors.descripcion && !form.isTariffed && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Unidad de medida</label>
              {form.isTariffed && form.tariffId ? (
                <div className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700">
                  {form.unidadMedida || <span className="text-slate-400 italic">No especificada</span>}
                </div>
              ) : (
                <input
                  type="text"
                  value={form.unidadMedida ?? ''}
                  onChange={(e) => update('unidadMedida', e.target.value || undefined)}
                  placeholder="Ej: Unidad, Día..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Cantidad <span className="text-primary">*</span>
              </label>
              <input
                type="number"
                step={1}
                min={1}
                value={form.cantidad}
                onChange={(e) => update('cantidad', e.target.valueAsNumber || 1)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.cantidad ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.cantidad && <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Categoría tributaria <span className="text-primary">*</span>
              </label>
              <select
                value={form.categoriaTributaria}
                onChange={(e) => update('categoriaTributaria', e.target.value as TaxCategory)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.categoriaTributaria ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              >
                <option value="">Seleccione</option>
                {TAX_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{taxCategoryLabels[cat]}</option>
                ))}
              </select>
              {errors.categoriaTributaria && <p className="text-xs text-red-500 mt-1">{errors.categoriaTributaria}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Valor unitario</label>
              <div className="w-full px-3 py-2.5 rounded-lg text-xs text-amber-700 bg-amber-50 border border-amber-200 flex items-start gap-2 h-[42px]">
                <Info className="w-4 h-4 shrink-0 text-amber-500 mt-px" />
                <span>Se definirá al cotizar el servicio.</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Aliado específico (opcional)</label>
              <select
                value={form.aliadoId ?? ''}
                onChange={(e) => update('aliadoId', e.target.value || undefined)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Usar aliado general del evento</option>
                {aliados?.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 min-w-0 truncate">
              {total > 0 && `Valor total estimado: $${total.toLocaleString()}`}
              {!form.descripcion.trim() && !form.nombre?.trim() && !form.tariffId && 'Sin servicio definido'}
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                {isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? 'Guardar cambios' : 'Añadir ítem'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
