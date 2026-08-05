import { useOffers, usePermissions } from '../hooks/useOffers'
import { OfferList } from '../components/OfferList'
import { exportOfferToExcel } from '../utils/excelExport'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'
import { useToast } from '../../../components/ToastProvider'
import { getApiErrorMessage } from '../../../lib/apiErrors'
import { getEventApi } from '../../../services/events.service'
import { useAllies } from '../../../hooks/useAllies'
import { useMunicipalities } from '../../../hooks/useMunicipalities'
import { useActiveCalculationParams } from '../../../hooks/useActiveCalculationParams'
import type { OfferState } from '../types'

export function OffersPage() {
  const {
    offers,
    search,
    setSearch,
    isLoading,
    error,
    changeState,
  } = useOffers()

  const { can } = usePermissions()
  const toast = useToast()
  const { data: aliados = [] } = useAllies()
  const { data: municipios = [] } = useMunicipalities()
  const rates = useActiveCalculationParams()

  async function handleExport(id: string) {
    const offer = offers.find((o) => o.id === id)
    if (!offer) return

    let event: Awaited<ReturnType<typeof getEventApi>> = null
    if (offer.eventoId) {
      try {
        event = await getEventApi(offer.eventoId)
      } catch {
        event = null
      }
    }

    exportOfferToExcel(offer, {
      event,
      aliados,
      municipios,
      rates,
      usuario: getCurrentUser(),
      fechaCorte: new Date(),
      filtros: search ? `Búsqueda: "${search}"` : 'Ninguno',
    })

    addAuditEntry({
      accion: 'Exportación de oferta',
      entidad: 'Offer',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Oferta ${offer.codigo} exportada a Excel`,
    })
  }

  async function handleChangeState(id: string, estado: OfferState) {
    try {
      await changeState(id, estado)
      toast.showToast(`Estado cambiado a ${estado}`)
    } catch (error) {
      toast.showToast(getApiErrorMessage(error, 'No se pudo cambiar el estado de la oferta'), 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 text-lg">Cargando ofertas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500 text-lg">No se pudieron cargar las ofertas</p>
        <p className="text-sm text-slate-400 mt-1">Verifique su conexión con el servidor</p>
      </div>
    )
  }

  return (
    <OfferList
      offers={offers}
      search={search}
      onSearchChange={setSearch}
      onExport={handleExport}
      onChangeState={handleChangeState}
      canExport={can('export')}
      canCreate={can('create')}
      canEdit={can('edit')}
      canChangeState={can('changeState')}
    />
  )
}
