import api from '../lib/api'
import type { CreateUserDto, UpdateUserDto, AuthUserDto } from './types'

export async function getUsersApi(): Promise<AuthUserDto[]> {
  const response = await api.get<AuthUserDto[]>('/api/v1/users')
  return response.data
}

export async function getUserApi(id: string): Promise<AuthUserDto> {
  const response = await api.get<AuthUserDto>(`/api/v1/users/${id}`)
  return response.data
}

export async function createUserApi(data: CreateUserDto): Promise<AuthUserDto> {
  const response = await api.post<AuthUserDto>('/api/v1/users', data)
  return response.data
}

export async function updateUserApi(id: string, data: UpdateUserDto): Promise<AuthUserDto> {
  const response = await api.patch<AuthUserDto>(`/api/v1/users/${id}`, data)
  return response.data
}
