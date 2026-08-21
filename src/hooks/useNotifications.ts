import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  createNotificationApi,
  type CreateNotificationDto,
} from '../services/notifications.service'
import { API_BASE_URL } from '../lib/api'

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_KEY = ['notifications', 'unread-count']

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotificationsApi,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: getUnreadCountApi,
  })
}

interface StreamEvent {
  type?: string
}

export function useNotificationsStream() {
  const qc = useQueryClient()

  useEffect(() => {
    let source: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let attempts = 0
    let disposed = false

    // Backoff exponencial: evita martillar el servidor (y los créditos de
    // Railway) con reintentos cuando el backend está caído o reiniciando.
    const BACKOFF_MS = [5000, 15000, 30000, 60000, 120000]

    function invalidate() {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    }

    function hasValidToken(): boolean {
      const token = sessionStorage.getItem('sigev-token')
      if (!token) return false
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))) as { exp?: number }
        return !!payload.exp && payload.exp * 1000 > Date.now()
      } catch {
        return false
      }
    }

    function connect() {
      if (disposed || !hasValidToken()) return

      const token = sessionStorage.getItem('sigev-token') as string
      source = new EventSource(
        `${API_BASE_URL}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`,
      )

      source.onopen = () => {
        if (attempts > 0) invalidate()
        attempts = 0
      }

      source.onerror = () => {
        source?.close()
        source = null
        const delay = BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)]
        attempts += 1
        retryTimer = setTimeout(connect, delay)
      }

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as StreamEvent
          if (payload.type === 'PING' || payload.type === 'CONNECTED') return
        } catch {
          // payload inválido: se ignora
        }
        invalidate()
      }
    }

    connect()

    return () => {
      disposed = true
      if (retryTimer) clearTimeout(retryTimer)
      source?.close()
    }
  }, [qc])
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationReadApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNotificationApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useCreateNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateNotificationDto) => createNotificationApi(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}
