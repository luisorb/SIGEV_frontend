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
    isLoading,
    error,
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
      canExport={can('export')}
      canCreate={can('create')}
      canEdit={can('edit')}
    />
  )
}
