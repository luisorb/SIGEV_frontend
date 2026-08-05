import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EventMapGroup } from '../types'
import { MAP_CENTER, MAP_ZOOM, MAP_MIN_ZOOM, MAP_MAX_ZOOM, STATE_MARKER_COLORS } from '../utils/mapConfig'
import { formatCurrencyCO } from '../../../utils/formatters'

interface ExecutionMapProps {
  groups: EventMapGroup[]
}

const stateBadge: Record<string, string> = {
  Abierto: 'bg-yellow-500',
  'En ejecución': 'bg-blue-500',
  Ejecutado: 'bg-orange-500',
  Cerrado: 'bg-slate-500',
  Legalizado: 'bg-purple-500',
  Devuelto: 'bg-amber-500',
  Rechazado: 'bg-rose-500',
}

function buildEventIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 20px; height: 20px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export function ExecutionMap({ groups }: ExecutionMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      center: [MAP_CENTER.lat, MAP_CENTER.lng],
      zoom: MAP_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    if (groups.length === 0) {
      map.setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM)
      return
    }

    const bounds = L.latLngBounds([])

    for (const group of groups) {
      for (const ev of group.eventos) {
        if (typeof ev.lat !== 'number' || typeof ev.lng !== 'number') continue

        const lat = ev.lat
        const lng = ev.lng

        const color = STATE_MARKER_COLORS[ev.estado] || '#64748B'
        const icon = buildEventIcon(color)
        const marker = L.marker([lat, lng], { icon }).addTo(map)

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 280px;">
            <div style="
              font-size: 14px; font-weight: 700; color: #0f172a;
              padding: 8px 0; border-bottom: 1px solid #e2e8f0;
            ">
              ${ev.numeroEvento}
              <span style="font-weight: 400; color: #64748b; font-size: 12px; margin-left: 8px;">
                ${group.municipioNombre}, ${group.departamento}
              </span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
              <tbody>
                <tr>
                  <td style="padding: 4px 6px; color: #475569;">Responsable</td>
                  <td style="padding: 4px 6px; font-weight: 600; color: #1e293b; text-align: right;">${ev.responsable}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 6px; color: #475569;">Estado</td>
                  <td style="padding: 4px 6px; text-align: right;">
                    <span style="
                      display: inline-block; width: 8px; height: 8px;
                      border-radius: 50%; ${stateBadge[ev.estado] || 'bg-slate-500'};
                      vertical-align: middle; margin-right: 4px;
                    "></span>
                    ${ev.estado}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 6px; color: #475569;">Total</td>
                  <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrencyCO(ev.total)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 6px; color: #475569;">Ubicación</td>
                  <td style="padding: 4px 6px; text-align: right; color: #475569;">${lat.toFixed(6)}, ${lng.toFixed(6)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `)

        markersRef.current.push(marker)
        bounds.extend([lat, lng])
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] })
    } else {
      map.setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM)
    }
  }, [groups])

  return <div ref={containerRef} className="w-full h-full rounded-xl border border-slate-200" />
}
