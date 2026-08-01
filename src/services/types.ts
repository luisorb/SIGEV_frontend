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
  isActive: boolean
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
  isActive?: boolean
}

export interface CreateEventDto {
  code: string
  suffix?: string
  schemaType?: 'cotizacion' | 'detalle'
  name: string
  description?: string
  dependency?: string
  hamlet?: string
  attendees?: number
  days?: number
  latitude?: number
  longitude?: number
  divipolaCode?: string
  municipalityName?: string
  municipalityCategory?: string
  generalAllyId?: string
  disbursementId?: string
  startDate?: string
  items?: CreateItemDto[]
}

export interface UpdateEventDto {
  code?: string
  suffix?: string
  schemaType?: 'cotizacion' | 'detalle'
  name?: string
  description?: string
  dependency?: string
  hamlet?: string
  attendees?: number
  days?: number
  latitude?: number
  longitude?: number
  divipolaCode?: string
  municipalityName?: string
  municipalityCategory?: string
  generalAllyId?: string
  disbursementId?: string
  startDate?: string
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
  code: string
  name: string
  amount: number
  year: number
  percentageParticipation?: number
  disbursementDate?: string
  status?: string
}

export interface UpdateDisbursementDto {
  code?: string
  name?: string
  amount?: number
  year?: number
  percentageParticipation?: number
  disbursementDate?: string
  status?: string
  isActive?: boolean
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
