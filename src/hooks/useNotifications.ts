import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
} from '../services/notifications.service'

const NOTIFICATIONS_KEY = ['notifications']
const UNREAD_KEY = ['notifications', 'unread-count']

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotificationsApi,
    refetchInterval: 30000,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: getUnreadCountApi,
    refetchInterval: 30000,
  })
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
