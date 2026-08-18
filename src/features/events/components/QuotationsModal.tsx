import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QuotationList } from './QuotationList'
import { useQuotations } from '../../offers/hooks/useQuotations'
import { getOfertaEconomicaByEventApi, mapOfertaEconomicaToOffer } from '../../../services/offers.service'
import { uploadAttachmentApi } from '../../../services/attachments.service'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { useToast } from '../../../components/ToastProvider'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { Modal } from '../../../layout/Modal'
import type { Event, EventState } from '../../../types'

const TERMINAL_STATES: EventState[] = ['Cancelado']

interface QuotationsModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
}

export function QuotationsModal({ event, isOpen, onClose }: QuotationsModalProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { can: userCan } = useRolePermissions()
  const { allQuotations: offers, selectQuotation, validateQuotation } = useQuotations()

  const { data: ofertaEconomica } = useQuery({
    queryKey: ['oferta-economica', event.id],
    queryFn: () => getOfertaEconomicaByEventApi(event.id).then((data) => (data ? mapOfertaEconomicaToOffer(data) : null)),
    enabled: isOpen,
  })

  const displayEstado = event.estado
  const canManageOffers = userCan('functional_admin', 'operator')
  const quotationApproved = !!event.cotizacionSeleccionadaId

  const offersReadOnly =
    !canManageOffers || TERMINAL_STATES.includes(displayEstado) || quotationApproved

  const canSelectQuotation =
    userCan('approver') && !TERMINAL_STATES.includes(displayEstado) && !quotationApproved

  async function handleValidateOffer(offerId: string) {
    try {
      await validateQuotation(offerId)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Validación de cotización ganadora',
        entidad: 'Quotation',
        entidadId: offerId,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización validada en el evento ${event.numeroEvento}; pendiente de aprobación definitiva por un segundo Aprobador`,
      })
      toast.showToast('Cotización validada; un segundo Aprobador debe ejecutar la aprobación definitiva')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo validar la cotización'), 'error')
    }
  }

  async function handleSelectOffer(offerId: string, file?: File, itemIds?: string[]) {
    try {
      if (file) {
        await uploadAttachmentApi(event.id, 'Comunicado de aprobación', file)
      }
      const quotation = await selectQuotation(offerId, itemIds)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Selección de cotización ganadora',
        entidad: 'Event',
        entidadId: event.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Cotización ${quotation.codigo} seleccionada; se generó la oferta económica definitiva${itemIds?.length ? ' con composición por ítem' : ''}`,
      })
      toast.showToast('Oferta económica definitiva generada')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo seleccionar la cotización'), 'error')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Cotizaciones"
      subtitle={`${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`}
      size="full"
    >
      <QuotationList
        eventoId={event.id}
        event={event}
        offers={offers}
        selectedOfferId={event.cotizacionSeleccionadaId}
        onSelectOffer={handleSelectOffer}
        onValidateOffer={handleValidateOffer}
        oferta={ofertaEconomica ?? null}
        readOnly={offersReadOnly}
        canSelectQuotation={canSelectQuotation}
      />
    </Modal>
  )
}
