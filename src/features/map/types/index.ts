export interface EventMapGroup {
  municipioId: string
  municipioNombre: string
  departamento: string
  lat: number
  lng: number
  eventos: Array<{
    id: string
    numeroEvento: string
    responsable: string
    estado: string
    total: number
    lat?: number
    lng?: number
  }>
  totalEventos: number
  totalValor: number
}
