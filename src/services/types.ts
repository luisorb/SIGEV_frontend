import type { RoleName } from '../types'

export interface LoginDto {
  document: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  user: AuthUserDto
}

export interface AuthUserDto {
  id: string
  document: string
  documentType: string
  fullName: string
  email: string
  roles: RoleDto[]
}

export interface RoleDto {
  id: string
  name: RoleName
  description: string
}

export interface CreateUserDto {
  document: string
  documentType: string
  fullName: string
  email: string
  password: string
  roles: string[]
}

export interface UpdateUserDto {
  document?: string
  documentType?: string
  fullName?: string
  email?: string
  password?: string
  roles?: string[]
}

export interface CreateEventDto {
  code: string
  name: string
  description?: string
  divipolaCode?: string
  municipalityName?: string
  municipalityCategory?: string
  generalAllyId?: string
  items?: CreateItemDto[]
}

export interface UpdateEventDto {
  code?: string
  name?: string
  description?: string
  divipolaCode?: string
  municipalityName?: string
  municipalityCategory?: string
  generalAllyId?: string
  items?: CreateItemDto[]
}

export interface ChangeStatusDto {
  status: 'Postulado' | 'En preparación' | 'En revisión' | 'En ejecución' | 'Cerrado' | 'Legalizado' | 'Devuelto' | 'Rechazado'
  observation?: string
  authorizeException?: boolean
}

export interface CreateItemDto {
  name: string
  description?: string
  quantity: number
  unitPrice: number
  ivaRate?: number
  consumptionTaxRate?: number
  feeRate?: number
  feeIvaRate?: number
  allyId?: string
  tariffId?: string
}

export interface UpdateItemDto {
  name?: string
  description?: string
  quantity?: number
  unitPrice?: number
  ivaRate?: number
  consumptionTaxRate?: number
  feeRate?: number
  feeIvaRate?: number
  allyId?: string
  tariffId?: string
}

export interface CreateAllyDto {
  name: string
  color?: string
  document?: string
  contactName?: string
  contactEmail?: string
}

export interface UpdateAllyDto {
  name?: string
  color?: string
  document?: string
  contactName?: string
  contactEmail?: string
  active?: boolean
}

export interface CreateDisbursementDto {
  name: string
  amount: number
  year: number
  status?: string
}

export interface UpdateDisbursementDto {
  name?: string
  amount?: number
  year?: number
  status?: string
  active?: boolean
}

export interface GenerateReportDto {
  format: 'pdf' | 'xlsx'
  type: 'offer' | 'matrix'
  eventId?: string
}

export interface MunicipalityQuery {
  divipolaCode?: string
  name?: string
  department?: string
}
