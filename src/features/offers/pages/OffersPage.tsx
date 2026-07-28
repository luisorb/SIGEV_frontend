import { useState } from 'react'
import { useOffers } from '../hooks/useOffers'
import { OfferList } from '../components/OfferList'
import { OfferDetailModal } from '../components/OfferDetailModal'

type ModalMode = 'create' | 'view' | 'edit'

export function OffersPage() {
  const {
    offers,
    search,
    setSearch,
    getOffer,
    createOffer,
    updateOffer,
    changeState,
    addItem,
    updateItem,
    removeItem: removeItemFromOffer,
  } = useOffers()

  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

  function openCreate() {
    setSelectedId(undefined)
    setModalMode('create')
  }

  function openView(id: string) {
    setSelectedId(id)
    setModalMode('view')
  }

  function openEdit(id: string) {
    setSelectedId(id)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedId(undefined)
  }

  const selectedOffer = selectedId ? getOffer(selectedId) : undefined

  return (
    <>
      <OfferList
        offers={offers}
        search={search}
        onSearchChange={setSearch}
        onView={openView}
        onEdit={openEdit}
        onCreate={openCreate}
      />

      {modalMode && (
        <OfferDetailModal
          isOpen
          mode={modalMode}
          offer={selectedOffer}
          onClose={closeModal}
          onCreate={createOffer}
          onUpdate={updateOffer}
          onChangeState={changeState}
          onAddItem={addItem}
          onUpdateItem={updateItem}
          onRemoveItem={removeItemFromOffer}
        />
      )}
    </>
  )
}
