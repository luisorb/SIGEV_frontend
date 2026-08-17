import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, X, Inbox } from 'lucide-react'
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '../hooks/useNotifications'
import type { NotificationItem } from '../services/notifications.service'

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  QUOTATION_CREATED: 'Nueva cotización',
  QUOTATION_APPROVED: 'Aprobación definitiva',
  EVENT_REJECTED: 'Orden rechazada',
  EVENT_RETURNED: 'Orden devuelta',
  ITEMS_ADDED: 'Ítems agregados',
}

function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface NotificationBellProps {
  onNotificationOpen?: () => void
}

export function NotificationBell({ onNotificationOpen }: NotificationBellProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const remove = useDeleteNotification()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next && onNotificationOpen) onNotificationOpen()
  }

  function handleItemClick(item: NotificationItem) {
    if (!item.read) markRead.mutate(item.id)
    if (item.event?.id) {
      setOpen(false)
      navigate(`/ordenes/${item.event.id}`)
    }
  }

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={toggleOpen}
        className={`relative p-2 rounded-lg transition-colors ${
          open ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-primary transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group ${
                    !item.read ? 'bg-red-50/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs font-semibold ${!item.read ? 'text-primary' : 'text-slate-500'}`}>
                        {NOTIFICATION_TYPE_LABELS[item.type] ?? item.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm leading-snug ${!item.read ? 'text-slate-800' : 'text-slate-500'}`}>
                    {item.message}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    {item.event ? (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Orden {item.event.code}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        remove.mutate(item.id)
                      }}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Eliminar notificación"
                    >
                      <X className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
