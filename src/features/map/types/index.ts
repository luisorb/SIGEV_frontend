export interface Coordinates {
  lat: number
  lng: number
}

export interface MunicipioCoords {
  id: string
  nombre: string
  departamento: string
  lat: number
  lng: number
}

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
  }>
  totalEventos: number
  totalValor: number
}
