import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { ManagedItem } from '../hooks/useItems'
import type { ItemInput, Ally, SchemaType } from '../../../types'
import { ItemRow } from './ItemRow'
import { AddItemModal } from './AddItemModal'

interface ItemManagerProps {
  items: ManagedItem[]
  aliados?: Ally[]
  onAddItem?: (item: ItemInput) => void | Promise<void>
  onUpdateItem?: (id: string, updates: ItemInput) => void | Promise<void>
  onRemoveItem?: (id: string) => void | Promise<void>
  readOnly?: boolean
  eventAliadoId?: string
  schemaType?: SchemaType
}

export function ItemManager({
  items,
  aliados,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  readOnly = false,
  eventAliadoId,
  schemaType = 'cotizacion',
}: ItemManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ManagedItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<ManagedItem | null>(null)

  const isDetalle = schemaType === 'detalle'
  const tarifadas = items.filter((i) => i.isTariffed)
  const noTarifadas = items.filter((i) => !i.isTariffed)
  const itemIndex = new Map(items.map((it, idx) => [it.id, idx]))

  function sectionRow(label: string, count: number, badgeClass: string) {
    return (
      <tr className="bg-slate-100/70">
        <td colSpan={readOnly ? 4 : 5} className="px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</span>
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${badgeClass}`}>
              {count}
            </span>
          </div>
        </td>
      </tr>
    )
  }

  async function handleAddItem(item: ItemInput) {
    await onAddItem?.(item)
  }

  async function handleEditItem(id: string, updates: ItemInput) {
    await onUpdateItem?.(id, updates)
  }

  function handleDeleteRequest(id: string) {
    const item = items.find((i) => i.id === id)
    if (item) setDeletingItem(item)
  }

  async function handleDeleteConfirm() {
    if (deletingItem) {
      await onRemoveItem?.(deletingItem.id)
      setDeletingItem(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <AddItemModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
        aliados={aliados}
        eventAliadoId={eventAliadoId}
      />
      <AddItemModal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        editItem={editingItem ?? undefined}
        onEdit={handleEditItem}
        aliados={aliados}
        eventAliadoId={eventAliadoId}
      />
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </span>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Ítems del Evento</h2>
            <span className="text-xs text-slate-400 font-medium ml-1">({items.length})</span>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              {onAddItem && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Ítem
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Tipo</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Unidad</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Cant.</th>
              {!readOnly && <th className="px-5 py-3.5 w-20" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-sm text-slate-400">
                      {readOnly ? 'Sin ítems registrados' : 'No hay ítems. Agrega uno manualmente.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : isDetalle ? (
              <>
                {sectionRow('Necesidades tarifadas', tarifadas.length, 'bg-green-100 text-green-700')}
                {tarifadas.length === 0 ? (
                  <tr>
                    <td colSpan={readOnly ? 4 : 5} className="px-5 py-4 text-center">
                      <p className="text-xs text-slate-400">Sin necesidades tarifadas</p>
                    </td>
                  </tr>
                ) : (
                  tarifadas.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      aliados={aliados}
                      onEdit={!readOnly ? setEditingItem : undefined}
                      onRemove={!readOnly ? handleDeleteRequest : undefined}
                      readOnly={readOnly}
                      index={itemIndex.get(item.id) ?? 0}
                    />
                  ))
                )}
                {sectionRow('Necesidades no tarifadas', noTarifadas.length, 'bg-slate-200 text-slate-700')}
                {noTarifadas.length === 0 ? (
                  <tr>
                    <td colSpan={readOnly ? 4 : 5} className="px-5 py-4 text-center">
                      <p className="text-xs text-slate-400">Sin necesidades no tarifadas</p>
                    </td>
                  </tr>
                ) : (
                  noTarifadas.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      aliados={aliados}
                      onEdit={!readOnly ? setEditingItem : undefined}
                      onRemove={!readOnly ? handleDeleteRequest : undefined}
                      readOnly={readOnly}
                      index={itemIndex.get(item.id) ?? 0}
                    />
                  ))
                )}
              </>
            ) : (
              items.map((item, i) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  aliados={aliados}
                  onEdit={!readOnly ? setEditingItem : undefined}
                  onRemove={!readOnly ? handleDeleteRequest : undefined}
                  readOnly={readOnly}
                  index={i}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-5 animate-[scaleIn_200ms_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-lg shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Eliminar ítem</h3>
                <p className="text-xs sm:text-sm text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm sm:text-base text-slate-700 mb-4">
              ¿Estás seguro de eliminar <span className="font-semibold">{deletingItem.descripcion}</span>?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] transition-all duration-150"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
