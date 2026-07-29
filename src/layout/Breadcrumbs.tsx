import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

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

  const parts = pathname.split('/').filter(Boolean)
  const segments = parts.map((_, i) => '/' + parts.slice(0, i + 1).join('/'))

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-500">
      <Link to="/" className="hover:text-slate-700 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1
        let label = routeLabels[segment]
        if (!label) {
          const lastPart = segment.split('/').pop() ?? ''
          label = lastPart === 'editar' ? 'Editar' : lastPart
        }
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
