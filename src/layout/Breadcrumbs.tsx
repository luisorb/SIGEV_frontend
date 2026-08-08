import { useLocation, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Home } from 'lucide-react'
import { getEventsApi } from '../services/events.service'
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

  const orderMatch = pathname.match(/^\/ordenes\/([^/]+)(?:\/)?/)
  const orderId = orderMatch?.[1] && orderMatch[1] !== 'nueva' ? orderMatch[1] : undefined

  const offerMatch = pathname.match(/^\/ofertas\/([^/]+)(?:\/)?/)
  const offerId = offerMatch?.[1] && offerMatch[1] !== 'nueva' ? offerMatch[1] : undefined

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: getEventsApi,
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
      const event = events.find((e) => e.id === orderSegment[1])
      if (event) return event.numeroEvento
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

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs lg:text-sm text-slate-500 min-w-0">
      <Link to="/" className="hover:text-slate-700 transition-colors shrink-0">
        <Home className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
      </Link>
      {segments.length > 1 && (
        <span className="flex items-center gap-1 lg:hidden min-w-0">
          {(() => {
            const mobileSegments = segments.length > 2
              ? [segments[0], segments[segments.length - 1]]
              : segments
            return mobileSegments.map((segment, idx, arr) => {
              const isLast = idx === arr.length - 1
              const label = resolveLabel(segment)
              return (
                <span key={segment} className="flex items-center gap-1 min-w-0">
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  <span className={`truncate ${isLast ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                    {label}
                  </span>
                </span>
              )
            })
          })()}
        </span>
      )}
      <div className="hidden lg:flex items-center gap-1 min-w-0">
        {segments.map((segment, idx) => {
          const isLast = idx === segments.length - 1
          const label = resolveLabel(segment)
          return (
            <span key={segment} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              {isLast ? (
                <span className="font-medium text-slate-900 truncate">{label}</span>
              ) : (
                <Link to={segment} className="hover:text-slate-700 transition-colors truncate whitespace-nowrap">
                  {label}
                </Link>
              )}
            </span>
          )
        })}
      </div>
    </nav>
  )
}
