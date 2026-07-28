import { useMemo } from 'react'
import type { Event } from '../../../types'
import type { EventMapGroup, MunicipioCoords } from '../types'

export function useMapMarkers(events: Event[], coordenadas: MunicipioCoords[]) {
  const coordsMap = useMemo(() => {
    const m: Record<string, MunicipioCoords> = {}
    for (const c of coordenadas) m[c.id] = c
    return m
  }, [coordenadas])

  const groups = useMemo<EventMapGroup[]>(() => {
    const grouped: Record<string, EventMapGroup> = {}

    for (const event of events) {
      const coord = coordsMap[event.municipioId]
      if (!coord) continue

      if (!grouped[event.municipioId]) {
        grouped[event.municipioId] = {
          municipioId: event.municipioId,
          municipioNombre: coord.nombre,
          departamento: coord.departamento,
          lat: coord.lat,
          lng: coord.lng,
          eventos: [],
          totalEventos: 0,
          totalValor: 0,
        }
      }

      const eventTotal = event.items.reduce((s, i) => s + i.total, 0)
      grouped[event.municipioId].eventos.push({
        id: event.id,
        numeroEvento: event.numeroEvento,
        responsable: event.responsable,
        estado: event.estado,
        total: eventTotal,
      })
      grouped[event.municipioId].totalEventos++
      grouped[event.municipioId].totalValor += eventTotal
    }

    return Object.values(grouped)
  }, [events, coordsMap])

  return { groups }
}
