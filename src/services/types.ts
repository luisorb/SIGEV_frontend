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
  allyId?: string | null
  ally?: { id: string; code: string; name: string } | null
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
  allyId?: string
}

export interface UpdateUserDto {
  document?: string
  documentType?: string
  fullName?: string
  email?: string
  password?: string
  roles?: string[]
  isActive?: boolean
  allyId?: string | null
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
  status: 'Abierto' | 'En ejecución' | 'Ejecutado' | 'Cerrado' | 'Legalizado' | 'Devuelto' | 'Rechazado'
  observation?: string
  authorizeException?: boolean
}

export interface CreateItemDto {
  name: string
  description?: string
  quantity: number
  unitPrice?: number
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
  code?: string
  name: string
  documentType: string
  document: string
  phone: string
  contactEmail: string
  divipolaCode: string
  divipolaDepartment: string
  contactName: string
  color?: string
  isActive?: boolean
}

export interface UpdateAllyDto {
  code?: string
  name?: string
  documentType?: string
  document?: string
  phone?: string
  contactEmail?: string
  divipolaCode?: string
  divipolaDepartment?: string
  contactName?: string
  color?: string
  isActive?: boolean
}

export interface CreateDisbursementDto {
  code: string
  name: string
  amount: number
  year: number
  percentageParticipation?: number
  disbursementDate?: string
  fechaInicio?: string
  fechaFin?: string
  status?: string
}

export interface UpdateDisbursementDto {
  code?: string
  name?: string
  amount?: number
  year?: number
  percentageParticipation?: number
  disbursementDate?: string
  fechaInicio?: string
  fechaFin?: string
  status?: string
  isActive?: boolean
}

export interface GenerateReportDto {
  format: 'pdf' | 'xlsx'
  type: 'offer' | 'matrix'
  eventId?: string
}

export interface CreateQuotationItemDto {
  description?: string
  quantity: number
  unitPrice?: number
  tariffId?: string
  isTariffed?: boolean
  ivaRate?: number
  consumptionTaxRate?: number
  feeRate?: number
  feeIvaRate?: number
  allyId?: string
}

export interface CreateQuotationDto {
  code?: string
  name: string
  description?: string
  cliente?: string
  eventId?: string
  allyId?: string
  currency?: string
  quotationDate?: string
  validityDays?: number
  observations?: string
  items?: CreateQuotationItemDto[]
}

export interface UpdateQuotationDto {
  code?: string
  name?: string
  description?: string
  cliente?: string
  eventId?: string
  allyId?: string
  currency?: string
  quotationDate?: string
  validityDays?: number
  observations?: string
  items?: CreateQuotationItemDto[]
}

export interface ChangeQuotationStatusDto {
  status: string
  observation?: string
}

export interface MunicipalityQuery {
  divipolaCode?: string
  name?: string
  department?: string
}
