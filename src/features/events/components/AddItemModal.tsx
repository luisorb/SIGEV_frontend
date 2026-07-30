import { useState, useEffect } from 'react'
import { Plus, Pencil, X } from 'lucide-react'
import type { ItemInput, Ally, TaxCategory } from '../../../types'
import { TAX_CATEGORIES } from '../../../config/constants'

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
  descripcion: '',
  cantidad: 1,
  valorUnitario: 0,
  categoriaTributaria: '' as TaxCategory,
  aliadoId: undefined,
}

const taxCategoryLabels: Record<TaxCategory, string> = {
  IVA: 'IVA (19%)',
  Consumo: 'Consumo (8%)',
  Tercero: 'Tercero (0%)',
  Reembolso: 'Reembolso (0%)',
}

export function AddItemModal({ open, onClose, onAdd, onEdit, editItem, aliados }: AddItemModalProps) {
  const [form, setForm] = useState<ItemInput>(emptyItem)
  const [errors, setErrors] = useState<Partial<Record<keyof ItemInput, string>>>({})

  const isEditing = !!editItem

  useEffect(() => {
    if (open && editItem) {
      setForm({
        descripcion: editItem.descripcion,
        cantidad: editItem.cantidad,
        valorUnitario: editItem.valorUnitario,
        categoriaTributaria: editItem.categoriaTributaria,
        aliadoId: editItem.aliadoId,
      })
    } else if (open) {
      setForm(emptyItem)
    }
    setErrors({})
  }, [open, editItem])

  if (!open) return null

  function validate(): boolean {
    const errs: Partial<Record<keyof ItemInput, string>> = {}
    if (!form.descripcion.trim()) errs.descripcion = 'La descripción es obligatoria'
    if (form.cantidad < 1) errs.cantidad = 'Debe ser mayor a 0'
    if (form.valorUnitario < 0) errs.valorUnitario = 'No puede ser negativo'
    if (!form.categoriaTributaria) errs.categoriaTributaria = 'Seleccione una categoría'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const data: ItemInput = {
      ...form,
      descripcion: form.descripcion.trim(),
      aliadoId: form.aliadoId || undefined,
    }
    if (isEditing && editItem && onEdit) {
      onEdit(editItem.id, data)
    } else if (onAdd) {
      onAdd(data)
    }
    setForm(emptyItem)
    setErrors({})
    onClose()
  }

  function handleClose() {
    setForm(emptyItem)
    setErrors({})
    onClose()
  }

  function update<K extends keyof ItemInput>(key: K, value: ItemInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-[scaleIn_200ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
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
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Descripción</label>
            <input
              type="text"
              value={form.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder="Descripción del ítem"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.descripcion ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
            />
            {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Cantidad</label>
              <input
                type="number"
                step={1}
                value={form.cantidad}
                onChange={(e) => update('cantidad', e.target.valueAsNumber || 0)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.cantidad ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.cantidad && <p className="text-xs text-red-500 mt-1">{errors.cantidad}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Valor Unitario</label>
              <input
                type="number"
                min={0}
                value={form.valorUnitario || ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value)
                  update('valorUnitario', isNaN(val) ? 0 : val)
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.valorUnitario ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
              />
              {errors.valorUnitario && <p className="text-xs text-red-500 mt-1">{errors.valorUnitario}</p>}
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

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Aliado</label>
            <select
              value={form.aliadoId ?? ''}
              onChange={(e) => update('aliadoId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Seleccione</option>
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
