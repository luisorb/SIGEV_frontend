import api from '../lib/api'
import type { GenerateReportDto } from './types'

export async function generateReportApi(data: GenerateReportDto): Promise<Blob> {
  const response = await api.post('/api/v1/reports/generate', data, {
    responseType: 'blob',
  })
  return response.data
}
