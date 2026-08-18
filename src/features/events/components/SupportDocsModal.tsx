import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SupportDocuments } from './SupportDocuments'
import { getEventApi } from '../../../services/events.service'
import { uploadAttachmentApi, deleteAttachmentApi, downloadAttachment } from '../../../services/attachments.service'
import { useRolePermissions } from '../../auth/useRolePermissions'
import { useToast } from '../../../components/ToastProvider'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { SOPORTES_MODIFICABLES } from '../../../types'
import { Modal } from '../../../layout/Modal'
import type { Event, EventState, TipoSoporte, Attachment } from '../../../types'

const SOPORTES_LOCKED_STATES: EventState[] = ['Ejecutado', 'Cerrado', 'Legalizado']
const TERMINAL_STATES: EventState[] = ['Cancelado']

interface SupportDocsModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
}

export function SupportDocsModal({ event: initialEvent, isOpen, onClose }: SupportDocsModalProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { can: userCan } = useRolePermissions()

  const { data: event } = useQuery({
    queryKey: ['event', initialEvent.id],
    queryFn: () => getEventApi(initialEvent.id),
    initialData: initialEvent,
    enabled: isOpen,
  })

  if (!event) return null

  const displayEstado = event.estado
  const isDevuelto = displayEstado === 'Devuelto'
  const esDevolucionLegalizacion = isDevuelto && event.devolucionLegalizacion === true

  const devueltoPermiteSoportes =
    isDevuelto &&
    (esDevolucionLegalizacion ||
      event.devueltoDesde === 'En ejecución' ||
      event.devueltoDesde === 'Ejecutado' ||
      event.devueltoDesde === 'Cerrado')

  const canEditSoportes =
    userCan('functional_admin', 'operator', 'supervisor') ||
    (isDevuelto && userCan('analista')) ||
    ((devueltoPermiteSoportes || displayEstado === 'En ejecución') &&
      userCan('solicitante'))

  const canEditFolder = (tipo: TipoSoporte): boolean => {
    if (!canEditSoportes) return false
    if (userCan('solicitante') && !SOPORTES_MODIFICABLES.includes(tipo)) return false
    return true
  }

  const quotationApproved = !!event.cotizacionSeleccionadaId

  const soportesReadOnly =
    SOPORTES_LOCKED_STATES.includes(displayEstado) ||
    !canEditSoportes ||
    TERMINAL_STATES.includes(displayEstado)

  async function handleUploadSoporte(tipo: TipoSoporte, file: File) {
    try {
      await uploadAttachmentApi(event.id, tipo, file)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Carga de soporte documental',
        entidad: 'Event',
        entidadId: event.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Soporte "${tipo}" cargado: ${file.name}`,
      })
      toast.showToast(`Soporte "${tipo}" cargado correctamente`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, `No se pudo cargar el soporte "${tipo}"`), 'error')
      throw error
    }
  }

  async function handleDeleteSoporte(soporteId: string) {
    try {
      await deleteAttachmentApi(soporteId)
      await queryClient.invalidateQueries({ queryKey: ['event', event.id] })
      addAuditEntry({
        accion: 'Eliminación de soporte documental',
        entidad: 'Event',
        entidadId: event.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Soporte eliminado del evento ${event.numeroEvento}`,
      })
      toast.showToast('Soporte eliminado')
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo eliminar el soporte'), 'error')
    }
  }

  async function handleDownloadAttachment(attachment: Attachment) {
    try {
      await downloadAttachment(attachment.id, attachment.originalName)
      addAuditEntry({
        accion: 'Descarga de adjunto',
        entidad: 'Attachment',
        entidadId: attachment.id,
        usuario: getCurrentUser(),
        fecha: new Date().toISOString(),
        detalle: `Adjunto "${attachment.originalName}" descargado del evento ${event.numeroEvento}`,
      })
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo descargar el adjunto'), 'error')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Soportes Documentales"
      subtitle={`${event.numeroEvento}${event.sufijo ? `-${event.sufijo}` : ''}`}
      size="full"
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <SupportDocuments
        soportes={event.soportes || []}
        attachments={event.attachments ?? []}
        readOnly={soportesReadOnly}
        canEditFolder={canEditFolder}
        eventStatus={displayEstado}
        devolucionLegalizacion={esDevolucionLegalizacion}
        devueltoDesde={event.devueltoDesde ?? null}
        quotationApproved={quotationApproved}
        hideHeader
        onUpload={handleUploadSoporte}
        onDelete={handleDeleteSoporte}
        onDownload={handleDownloadAttachment}
      />
    </Modal>
  )
}
