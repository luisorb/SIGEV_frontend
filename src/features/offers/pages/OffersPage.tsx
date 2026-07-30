import { useOffers, usePermissions } from '../hooks/useOffers'
import { OfferList } from '../components/OfferList'
import { exportOfferToExcel } from '../utils/excelExport'
import { addAuditEntry } from '../../../lib/auditStore'
import { getCurrentUser } from '../../../config/constants'

export function OffersPage() {
  const {
    offers,
    search,
    setSearch,
  } = useOffers()

  const { can } = usePermissions()

  function handleExport(id: string) {
    const offer = offers.find((o) => o.id === id)
    if (!offer) return
    exportOfferToExcel(offer)
    addAuditEntry({
      accion: 'Exportación de oferta',
      entidad: 'Offer',
      entidadId: id,
      usuario: getCurrentUser(),
      fecha: new Date().toISOString(),
      detalle: `Oferta ${offer.codigo} exportada a Excel`,
    })
  }

  return (
    <OfferList
      offers={offers}
      search={search}
      onSearchChange={setSearch}
      onExport={handleExport}
      canExport={can('export')}
      canCreate={can('create')}
      canEdit={can('edit')}
    />
  )
}
