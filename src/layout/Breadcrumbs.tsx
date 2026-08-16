import { useLocation, useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Home } from 'lucide-react'
import { getEventApi } from '../services/events.service'
import { getQuotationsApi, mapQuotationResponse } from '../services/quotations.service'

const routeLabels: Record<string, string> = {
  '/': 'Panel',
  '/ordenes': 'Órdenes',
  '/ordenes/nueva': 'Nueva Orden',
  '/ofertas': 'Ofertas Económicas',
  '/matriz': 'Matriz de Ejecución',
  '/tablero': 'Tablero',
  '/mapa': 'Mapa',
  '/parametros': 'Parámetros',
  '/usuarios': 'Usuarios',
  '/auditoria': 'Auditoría',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()

  const isDeletedHistory = pathname === '/ordenes' && searchParams.get('anuladas') === '1'

  const orderMatch = pathname.match(/^\/ordenes\/([^/]+)(?:\/)?/)
  const orderId = orderMatch?.[1] && orderMatch[1] !== 'nueva' ? orderMatch[1] : undefined

  const offerMatch = pathname.match(/^\/ofertas\/([^/]+)(?:\/)?/)
  const offerId = offerMatch?.[1] && offerMatch[1] !== 'nueva' ? offerMatch[1] : undefined

  const { data: orderEvent } = useQuery({
    queryKey: ['event', orderId],
    queryFn: () => getEventApi(orderId!),
    enabled: Boolean(orderId),
  })

  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => (await getQuotationsApi()).map(mapQuotationResponse),
    enabled: Boolean(offerId),
  })

  function resolveLabel(segment: string): string {
    const direct = routeLabels[segment]
    if (direct) return direct
    const orderSegment = segment.match(/^\/ordenes\/([^/]+)$/)
    if (orderSegment && orderSegment[1] !== 'nueva') {
      if (orderEvent && orderEvent.id === orderSegment[1]) return orderEvent.numeroEvento
      return orderSegment[1]
    }
    const offerSegment = segment.match(/^\/ofertas\/([^/]+)$/)
    if (offerSegment && offerSegment[1] !== 'nueva') {
      const quotation = quotations.find((q) => q.id === offerSegment[1])
      const code =
        quotation &&
        ((quotation as { codigo?: string }).codigo ?? (quotation as { code?: string }).code)
      if (code) return code
      return offerSegment[1]
    }
    const lastPart = segment.split('/').pop() ?? ''
    return lastPart === 'editar' ? 'Editar' : lastPart
  }

  const parts = pathname.split('/').filter(Boolean)
  const segments = parts.map((_, i) => '/' + parts.slice(0, i + 1).join('/'))

  const items = segments.map((segment, idx) => ({
    segment,
    label: resolveLabel(segment),
    isLast: idx === segments.length - 1 && !isDeletedHistory,
  }))
  if (isDeletedHistory) {
    items.push({ segment: 'anuladas', label: 'Histórico de órdenes anuladas', isLast: true })
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs lg:text-sm text-slate-500 min-w-0">
      <Link to="/" className="hover:text-slate-700 transition-colors shrink-0">
        <Home className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
      </Link>
      {items.length > 1 && (
        <span className="flex items-center gap-1 lg:hidden min-w-0">
          {(() => {
            const mobileItems = items.length > 2
              ? [items[0], items[items.length - 1]]
              : items
            return mobileItems.map((item, idx) => {
              const isLast = item.isLast || idx === mobileItems.length - 1
              return (
                <span key={item.segment} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  <span className={`truncate ${isLast ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </span>
              )
            })
          })()}
        </span>
      )}
      <div className="hidden lg:flex items-center gap-1 min-w-0">
        {items.map((item, idx) => {
          const isLast = item.isLast || idx === items.length - 1
          return (
            <span key={item.segment} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              {isLast ? (
                <span className="font-medium text-slate-900 truncate">{item.label}</span>
              ) : (
                <Link to={item.segment} className="hover:text-slate-700 transition-colors truncate whitespace-nowrap">
                  {item.label}
                </Link>
              )}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
