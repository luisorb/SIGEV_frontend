import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  FileSpreadsheet,
  Table2,
  KanbanSquare,
  Map,
  Settings,
  Users,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { label: 'Panel', to: '/', icon: LayoutDashboard },
  { label: 'Órdenes', to: '/ordenes', icon: ClipboardList },
  { label: 'Ofertas Económicas', to: '/ofertas', icon: FileSpreadsheet },
  { label: 'Matriz de Ejecución', to: '/matriz', icon: Table2 },
  { label: 'Tablero', to: '/tablero', icon: KanbanSquare },
  { label: 'Mapa', to: '/mapa', icon: Map },
  { label: 'Parámetros', to: '/parametros', icon: Settings },
  { label: 'Usuarios', to: '/usuarios', icon: Users },
  { label: 'Auditoría', to: '/auditoria', icon: ShieldAlert },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col bg-slate-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight">SIGEV</span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
