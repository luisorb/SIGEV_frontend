import { AxiosError } from 'axios'

interface ApiErrorPayload {
  message?: string
  error?: string
}

export function getApiErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiErrorPayload>
    const status = axiosError.response?.status
    const message = axiosError.response?.data?.message ?? axiosError.response?.data?.error
    if (status === 403) return 'No tiene permisos para realizar esta acción.'
    if (status === 404) return 'El recurso solicitado no existe.'
    if (status === 401) return 'Su sesión expiró. Vuelva a iniciar sesión.'
    if (status === 400) return message ?? 'La solicitud no es válida.'
    if (message) return message
  }
  return fallback
}

export function getApiStatus(error: unknown): number | null {
  if (error && typeof error === 'object' && 'response' in error) {
    return (error as AxiosError).response?.status ?? null
  }
  return null
}
