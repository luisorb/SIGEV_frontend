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
  Postulado: 'bg-yellow-500',
  'En preparación': 'bg-blue-500',
  'En revisión': 'bg-orange-500',
  'En ejecución': 'bg-primary',
  Cerrado: 'bg-slate-500',
  Legalizado: 'bg-purple-500',
  Devuelto: 'bg-amber-500',
  Rechazado: 'bg-rose-500',
}

function buildIcon(count: number, color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 36px; height: 36px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 12px; font-weight: 700;
    ">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
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
      const stateCounts: Record<string, number> = {}
      for (const ev of group.eventos) {
        stateCounts[ev.estado] = (stateCounts[ev.estado] || 0) + 1
      }
      const dominantState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0][0]
      const color = STATE_MARKER_COLORS[dominantState] || '#64748B'

      const icon = buildIcon(group.totalEventos, color)
      const marker = L.marker([group.lat, group.lng], { icon }).addTo(map)

      const eventRows = group.eventos
        .map(
          (ev) => `
          <tr>
            <td style="padding: 2px 6px; font-weight: 600; color: #1e293b;">
              ${ev.numeroEvento}
            </td>
            <td style="padding: 2px 6px; color: #475569;">${ev.responsable}</td>
            <td style="padding: 2px 6px;">
              <span style="
                display: inline-block; width: 8px; height: 8px;
                border-radius: 50%; ${stateBadge[ev.estado] || 'bg-slate-500'};
                vertical-align: middle; margin-right: 4px;
              "></span>
              ${ev.estado}
            </td>
            <td style="padding: 2px 6px; text-align: right; font-weight: 600; color: #1e293b;">
              ${formatCurrencyCO(ev.total)}
            </td>
          </tr>`
        )
        .join('')

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 320px;">
          <div style="
            font-size: 14px; font-weight: 700; color: #0f172a;
            padding: 8px 0; border-bottom: 1px solid #e2e8f0;
          ">
            ${group.municipioNombre}, ${group.departamento}
            <span style="font-weight: 400; color: #64748b; font-size: 12px; margin-left: 8px;">
              ${group.totalEventos} evento${group.totalEventos !== 1 ? 's' : ''}
            </span>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
            <thead>
              <tr style="font-size: 11px; color: #64748b; text-transform: uppercase;">
                <th style="padding: 4px 6px; text-align: left;">Evento</th>
                <th style="padding: 4px 6px; text-align: left;">Responsable</th>
                <th style="padding: 4px 6px; text-align: left;">Estado</th>
                <th style="padding: 4px 6px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${eventRows}</tbody>
          </table>
          <div style="
            margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;
            text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;
          ">
            Total agregado: ${formatCurrencyCO(group.totalValor)}
          </div>
        </div>
      `)

      markersRef.current.push(marker)
      bounds.extend([group.lat, group.lng])
    }

    if (groups.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [groups])

  return <div ref={containerRef} className="w-full h-full rounded-xl border border-slate-200" />
}
