import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../features/auth/useAuth'
import { Breadcrumbs } from './Breadcrumbs'
import { ROLE_LABELS } from '../lib/permissions'

interface NavbarProps {
  onToggleSidebar: () => void
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const userInitial = user?.nombre?.charAt(0).toUpperCase() ?? '?'
  const userRoles = (user?.roleNames ?? [])
    .map((name) => ROLE_LABELS[name as keyof typeof ROLE_LABELS] ?? name)
    .join(', ')

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <Breadcrumbs />
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-white">{userInitial}</span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-900">{user?.nombre ?? 'Usuario'}</p>
            <p className="text-xs text-slate-500">{userRoles}</p>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">{user?.nombre ?? 'Usuario'}</p>
              <p className="text-xs text-slate-500">{userRoles}</p>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <Settings className="w-4 h-4" />
              Configuración
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
