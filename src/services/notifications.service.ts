import api from '../lib/api'

export interface NotificationItem {
  id: string
  type: string
  message: string
  read: boolean
  readAt?: string
  createdAt: string
  event?: { id: string; code: string; suffix: string }
}

export async function getNotificationsApi(): Promise<NotificationItem[]> {
  const response = await api.get<NotificationItem[]>('/api/v1/notifications')
  return response.data
}

export async function getUnreadCountApi(): Promise<number> {
  const response = await api.get<number>('/api/v1/notifications/unread-count')
  return response.data
}

export async function markNotificationReadApi(id: string): Promise<NotificationItem> {
  const response = await api.patch<NotificationItem>(`/api/v1/notifications/${id}/read`)
  return response.data
}

export async function markAllNotificationsReadApi(): Promise<{ count: number }> {
  const response = await api.patch<{ count: number }>('/api/v1/notifications/read-all')
  return response.data
}

export async function deleteNotificationApi(id: string): Promise<void> {
  await api.delete(`/api/v1/notifications/${id}`)
}

export interface CreateNotificationDto {
  type: string
  message: string
  eventId: string
}

export async function createNotificationApi(dto: CreateNotificationDto): Promise<NotificationItem> {
  const response = await api.post<NotificationItem>('/api/v1/notifications', dto)
  return response.data
}
