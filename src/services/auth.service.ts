import api from '../lib/api'
import type { LoginDto, AuthResponse } from './types'

export async function loginApi(data: LoginDto): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/api/v1/auth/login', data)
  return response.data
}
