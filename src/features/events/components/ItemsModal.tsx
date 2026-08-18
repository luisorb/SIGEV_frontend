import { useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ItemManager } from './ItemManager'
import { useItems, type ManagedItem } from '../hooks/useItems'
import { useAllies } from '../../../hooks/useAllies'
import { updateEventApi, updateEventItemsApi } from '../../../services/events.service'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { useToast } from '../../../components/ToastProvider'
import { useCreateNotification } from '../../../hooks/useNotifications'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { Modal } from '../../../layout/Modal'
import type { Event, EventState, Item, ItemInput } from '../../../types'

const TERMINAL_STATES: EventState[] = ['Cancelado']

interface ItemsModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
}

export function ItemsModal({ event, isOpen, onClose }: ItemsModalProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { can: userCan } = useRolePermissions()
  const createNotification = useCreateNotification()

  const {
    items,
    addItem,
    updateItem,
    removeItem,
  } = useItems(
    event.items.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      unidadMedida: i.unidadMedida,
      cantidad: i.cantidad,
      valorUnitario: i.valorUnitario,
      categoriaTributaria: i.categoriaTributaria,
      aliadoId: i.aliadoId,
      tariffId: i.tariffId,
      isTariffed: i.isTariffed,
      createdAt: i.createdAt,
    })),
  )

  const { data: aliados = [] } = useAllies({ all: true })

  const displayEstado = event.estado
  const isDevuelto = displayEstado === 'Devuelto'
  const quotationApproved = !!event.cotizacionSeleccionadaId

  const canModifyItems =
    userCan('functional_admin') ||
    (isDevuelto && userCan('analista')) ||
    (userCan('solicitante') &&
      (isDevuelto || displayEstado === 'Abierto' || displayEstado === 'En ejecución'))

  const lockReasons = new Map<string, string>()
  for (const item of event.items) {
    if (item.pagado) {
      lockReasons.set(item.id, 'Este ítem ya fue pagado y no se puede editar ni eliminar.')
    }
  }
  if (event.cotizacionSeleccionadaId) {
    const approvedQuotation = event.quotations?.find((q) => q.id === event.cotizacionSeleccionadaId)
    for (const qi of approvedQuotation?.items ?? []) {
      if (qi.itemId) {
        lockReasons.set(qi.itemId, 'Este ítem está incluido en la cotización aprobada y no se puede editar ni eliminar.')
      }
    }
  }

  const itemsReadOnly =
    !canModifyItems ||
    TERMINAL_STATES.includes(displayEstado) ||
    (quotationApproved && !userCan('solicitante'))

  const persistChainRef = useRef<Promise<void>>(Promise.resolve())

  function buildItemsPayload(nextItems: ManagedItem[]): Item[] {
    return nextItems.map((i) => ({
      id: i.id,
      eventoId: event.id,
      nombre: i.nombre,
      descripcion: i.descripcion,
      unidadMedida: i.unidadMedida,
      cantidad: i.cantidad,
      valorUnitario: i.valorUnitario,
      categoriaTributaria: i.categoriaTributaria,
      aliadoId: i.aliadoId,
      tariffId: i.tariffId,
      isTariffed: i.isTariffed,
      base: i.totals.base,
      iva: i.totals.iva,
      impuestoConsumo: i.totals.impuestoConsumo,
      feeTarifado: i.totals.feeTarifado,
      feeTerceros: i.totals.feeTerceros,
      ivaFee: i.totals.ivaFee,
      total: i.totals.total,
    }))
  }

  function persistItems(nextItems: ManagedItem[]): Promise<void> {
    const task = persistChainRef.current.then(async () => {
      const payload = buildItemsPayload(nextItems)
      if (userCan('solicitante')) {
        await updateEventItemsApi(event.id, payload)
      } else {
        await updateEventApi(event.id, { ...event, items: payload })
      }
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      await queryClient.invalidateQueries({ queryKey: ['events'] })
    })
    persistChainRef.current = task.catch(() => {})
    return task
  }

  async function handleAddItem(item: ItemInput) {
    try {
      await persistItems(addItem(item))
      toast.showToast('Ítem agregado correctamente')
      if (event.estado === 'Abierto') {
        createNotification.mutate({
          type: 'ITEMS_ADDED',
          message: `Se agregaron ítems a la orden ${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''} en estado Abierto`,
          eventId: event.id,
        })
      }
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo agregar el ítem'), 'error')
    }
  }

  async function handleUpdateItem(id: string, updates: ItemInput) {
    try {
      await persistItems(updateItem(id, updates))
      toast.showToast('Ítem actualizado correctamente')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo actualizar el ítem'), 'error')
    }
  }

  async function handleRemoveItem(id: string) {
    try {
      await persistItems(removeItem(id))
      toast.showToast('Ítem eliminado correctamente')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo eliminar el ítem'), 'error')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Ítems"
      subtitle={`${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''} · ${items.length} ítem${items.length !== 1 ? 's' : ''}`}
      size="full"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <ItemManager
        items={items}
        aliados={aliados}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        readOnly={itemsReadOnly}
        lockReasons={lockReasons}
        eventAliadoId={event.aliadoId}
        schemaType={event.esquema}
      />
    </Modal>
  )
}
