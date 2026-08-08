import api from '../lib/api'
import type { Attachment } from '../types'

export async function downloadAttachmentApi(id: string): Promise<Blob> {
  const response = await api.get(`/api/v1/attachments/${id}`, {
    responseType: 'blob',
  })
  return response.data
}

export async function getEventAttachmentsApi(eventId: string): Promise<Attachment[]> {
  const response = await api.get<unknown[]>(`/api/v1/attachments/event/${eventId}`)
  return response.data as Attachment[]
}

export async function uploadAttachmentApi(
  eventId: string,
  category: string,
  file: File,
  quotationId?: string,
): Promise<Attachment> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  if (quotationId) formData.append('quotationId', quotationId)
  const response = await api.post<Attachment>(
    `/api/v1/attachments/event/${eventId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return response.data
}

export async function deleteAttachmentApi(id: string): Promise<void> {
  await api.delete(`/api/v1/attachments/${id}`)
}

export function saveBlobAsFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadAttachment(id: string, fileName: string): Promise<void> {
  const blob = await downloadAttachmentApi(id)
  saveBlobAsFile(blob, fileName)
}
