import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const routeLabels: Record<string, string> = {
  '/': 'Panel',
  '/ordenes': 'Órdenes',
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

  const segments = pathname === '/' ? ['/'] : pathname.split('/').filter(Boolean).map((s) => `/${s}`)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
      <Link to="/" className="hover:text-slate-700 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {segments.map((segment, idx) => {
        const label = routeLabels[segment] || segment.replace('/', '').replace(/-/g, ' ')
        const isLast = idx === segments.length - 1
        return (
          <span key={segment} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5" />
            {isLast ? (
              <span className="font-medium text-slate-900">{label}</span>
            ) : (
              <Link to={segment} className="hover:text-slate-700 transition-colors">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
