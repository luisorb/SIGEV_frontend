import api from '../lib/api'

export interface BackupFile {
  id: string
  file: string
  size: number
  createdAt: string
}

export async function createBackupApi(): Promise<BackupFile> {
  const response = await api.post<BackupFile>('/api/v1/backup')
  return response.data
}

export async function getBackupsApi(): Promise<BackupFile[]> {
  const response = await api.get<BackupFile[]>('/api/v1/backup')
  return response.data
}

export async function downloadBackupApi(id: string): Promise<void> {
  const response = await api.get(`/api/v1/backup/${id}/download`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = id
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
