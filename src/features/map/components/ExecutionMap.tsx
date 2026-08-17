import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EventMapGroup } from '../types'
import { MAP_CENTER, MAP_ZOOM, MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '../utils/mapConfig'
import { formatCurrencyCO } from '../../../utils/formatters'

interface ExecutionMapProps {
  groups: EventMapGroup[]
  aliadosMap: Record<string, { nombre: string; color: string }>
}

const DEFAULT_MARKER_COLOR = '#64748B'

const stateHexColors: Record<string, string> = {
  Abierto: '#eab308',
  'En ejecución': '#3b82f6',
  Ejecutado: '#f97316',
  Cerrado: '#64748b',
  Legalizado: '#a855f7',
  Devuelto: '#f59e0b',
  Cancelado: '#f43f5e',
}

function buildEventIcon(color: string, size = 20): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,.35);
      transition: transform 0.15s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function buildClusterIcon(count: number): L.DivIcon {
  const size = count < 10 ? 36 : count < 100 ? 44 : 52
  const fontSize = count < 10 ? 13 : count < 100 ? 12 : 11
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: rgba(244, 51, 64, 0.9);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 10px rgba(0,0,0,.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: ${fontSize}px;
      font-family: system-ui, sans-serif;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildPopupHtml(
  ev: { numeroEvento: string; responsable: string; estado: string; total: number; aliadoId?: string; lat?: number; lng?: number },
  groupName: { municipioNombre: string; departamento: string },
  aliadosMap: Record<string, { nombre: string; color: string }>,
): string {
  const ally = ev.aliadoId ? aliadosMap[ev.aliadoId] : undefined
  const stateColor = stateHexColors[ev.estado] || '#64748b'
  const allyColor = ally?.color || DEFAULT_MARKER_COLOR

  return `
    <div style="font-family: system-ui, sans-serif; min-width: 260px; padding: 6px 6px 4px 6px;">
      <div style="
        font-size: 14px; font-weight: 700; color: #0f172a;
        padding-bottom: 8px; margin-bottom: 8px;
        border-bottom: 1px solid #e2e8f0;
        display: flex; align-items: center; gap: 6px;
        padding-right: 28px;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span>${escapeHtml(ev.numeroEvento)}</span>
        <span style="font-weight: 400; color: #64748b; font-size: 11px;">
          ${escapeHtml(groupName.municipioNombre)}, ${escapeHtml(groupName.departamento)}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #64748b;">Aliado</span>
          <span style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #1e293b;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${allyColor};"></span>
            ${escapeHtml(ally?.nombre || 'Sin aliado')}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #64748b;">Responsable</span>
          <span style="font-size: 12px; font-weight: 600; color: #1e293b;">${escapeHtml(ev.responsable)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #64748b;">Estado</span>
          <span style="
            display: inline-flex; align-items: center; gap: 4px;
            font-size: 11px; font-weight: 600; color: white;
            background: ${stateColor}; padding: 2px 8px; border-radius: 999px;
          ">
            ${escapeHtml(ev.estado)}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #64748b;">Total</span>
          <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${formatCurrencyCO(ev.total)}</span>
        </div>
        ${typeof ev.lat === 'number' && typeof ev.lng === 'number' ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #64748b;">Coordenadas</span>
          <span style="font-size: 11px; color: #94a3b8; font-family: monospace;">${ev.lat.toFixed(5)}, ${ev.lng.toFixed(5)}</span>
        </div>` : ''}
      </div>
    </div>
  `
}

function addResetControl(map: L.Map) {
  const ResetControl = L.Control.extend({
    onAdd: function () {
      const btn = L.DomUtil.create('button')
      btn.title = 'Restablecer vista'
      btn.style.cssText = 'background: white; border: none; border-radius: 8px; width: 36px; height: 36px; box-shadow: 0 2px 6px rgba(0,0,0,.15); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s;'
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`
      btn.onmouseenter = () => { btn.style.background = '#f1f5f9' }
      btn.onmouseleave = () => { btn.style.background = 'white' }
      L.DomEvent.disableClickPropagation(btn)
      btn.addEventListener('click', () => {
        map.flyTo([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM, { duration: 0.8 })
      })
      return btn
    },
  })
  new ResetControl({ position: 'topleft' }).addTo(map)
}

function clusterNearbyMarkers(
  groups: EventMapGroup[],
  aliadosMap: Record<string, { nombre: string; color: string }>,
  map: L.Map,
  markersRef: L.Layer[],
): void {
  const POINT_RADIUS = 0.005

  for (const group of groups) {
    const allEvents = group.eventos.filter(
      (ev) => typeof ev.lat === 'number' && typeof ev.lng === 'number',
    )

    const groups2d: typeof allEvents[] = []
    const used = new Set<number>()

    for (let i = 0; i < allEvents.length; i++) {
      if (used.has(i)) continue
      const cluster = [allEvents[i]]
      used.add(i)
      for (let j = i + 1; j < allEvents.length; j++) {
        if (used.has(j)) continue
        const a = allEvents[i], b = allEvents[j]
        if (Math.abs((a.lat ?? 0) - (b.lat ?? 0)) < POINT_RADIUS &&
            Math.abs((a.lng ?? 0) - (b.lng ?? 0)) < POINT_RADIUS) {
          cluster.push(allEvents[j])
          used.add(j)
        }
      }
      groups2d.push(cluster)
    }

    for (const cluster of groups2d) {
      const lat = cluster[0].lat!
      const lng = cluster[0].lng!

      if (cluster.length === 1) {
        const ev = cluster[0]
        const ally = ev.aliadoId ? aliadosMap[ev.aliadoId] : undefined
        const color = ally?.color || DEFAULT_MARKER_COLOR
        const marker = L.marker([lat, lng], { icon: buildEventIcon(color) }).addTo(map)
        marker.bindPopup(buildPopupHtml(ev, group, aliadosMap))
        markersRef.push(marker)
      } else {
        const marker = L.marker([lat, lng], { icon: buildClusterIcon(cluster.length) }).addTo(map)
        marker.bindPopup(
          `<div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 6px 6px 4px 6px;">
            <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-right: 28px;">
              ${cluster.length} eventos en esta ubicación
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${cluster.map((ev) => {
                const stateColor = stateHexColors[ev.estado] || '#64748b'
                return `<div style="display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 6px; background: #f8fafc; cursor: pointer;" onclick="document.querySelector('.leaflet-popup-close-button')?.click()">
                  <span style="width: 6px; height: 6px; border-radius: 50%; background: ${stateColor}; flex-shrink: 0;"></span>
                  <span style="font-size: 12px; font-weight: 600; color: #0f172a; flex: 1;">${escapeHtml(ev.numeroEvento)}</span>
                  <span style="font-size: 11px; color: #64748b;">${escapeHtml(ev.estado)}</span>
                </div>`
              }).join('')}
            </div>
          </div>`,
        )
        markersRef.push(marker)
      }
    }
  }
}

export function ExecutionMap({ groups, aliadosMap }: ExecutionMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.Layer[]>([])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      center: [MAP_CENTER.lat, MAP_CENTER.lng],
      zoom: MAP_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      zoomControl: false,
    })

    L.control.zoom({ position: 'topleft' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    addResetControl(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => {
      if (map.hasLayer(m)) map.removeLayer(m)
    })
    markersRef.current = []

    if (groups.length === 0) {
      map.setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM)
      return
    }

    clusterNearbyMarkers(groups, aliadosMap, map, markersRef.current)

    const bounds = L.latLngBounds([])
    for (const group of groups) {
      for (const ev of group.eventos) {
        if (typeof ev.lat === 'number' && typeof ev.lng === 'number') {
          bounds.extend([ev.lat, ev.lng])
        }
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 })
    } else {
      map.setView([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM)
    }
  }, [groups, aliadosMap])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl border border-slate-200" />
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,.12) !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
          line-height: 1.5 !important;
        }
        .leaflet-popup-close-button {
          top: 14px !important;
          right: 10px !important;
          width: 24px !important;
          height: 24px !important;
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 6px !important;
          background: #f1f5f9 !important;
          color: #64748b !important;
          font-size: 16px !important;
          line-height: 24px !important;
          z-index: 10 !important;
        }
        .leaflet-popup-close-button:hover {
          background: #e2e8f0 !important;
          color: #334155 !important;
        }
        .leaflet-popup-tip-container {
          z-index: -1 !important;
        }
        .leaflet-popup-tip {
          box-shadow: 0 2px 6px rgba(0,0,0,.08) !important;
        }
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          font-size: 16px !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,.12) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
