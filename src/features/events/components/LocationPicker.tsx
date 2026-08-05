import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_CENTER, MAP_ZOOM } from '../../map/utils/mapConfig'
import type { Municipality } from '../../../types'
import { MapPin, X } from 'lucide-react'

interface LocationPickerProps {
  latitud?: number
  longitud?: number
  municipio?: Municipality
  onSelect: (lat: number, lng: number) => void
  onClose: () => void
}

export function LocationPicker({ latitud, longitud, municipio, onSelect, onClose }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  const initialPosition =
    typeof latitud === 'number' && typeof longitud === 'number' ? { lat: latitud, lng: longitud } : null

  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(initialPosition)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: L.LatLngExpression = initialPosition
      ? [initialPosition.lat, initialPosition.lng]
      : municipio?.lat !== undefined && municipio.lng !== undefined
        ? [municipio.lat, municipio.lng]
        : [MAP_CENTER.lat, MAP_CENTER.lng]

    const zoom = initialPosition ? 14 : municipio?.lat !== undefined ? 11 : MAP_ZOOM

    const map = L.map(containerRef.current, {
      center,
      zoom,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width: 22px; height: 22px;
        background: #E11D48;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,.35);
      "></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    })

    const marker = L.marker(center, { icon, draggable: true }).addTo(map)
    markerRef.current = marker

    map.on('click', (e: L.LeafletMouseEvent) => {
      const pos = { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }
      marker.setLatLng([pos.lat, pos.lng])
      setPosition(pos)
    })

    marker.on('dragend', () => {
      const p = marker.getLatLng()
      const pos = { lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) }
      setPosition(pos)
    })

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 60)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Asignar ubicación</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <p className="text-sm text-slate-600">
            Haz clic en el mapa (o arrastra el marcador) para fijar la ubicación del evento.
          </p>
        </div>

        <div ref={containerRef} className="h-[380px] w-full" />

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-primary" />
            {position ? (
              <span className="font-medium text-slate-800">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </span>
            ) : (
              <span>Sin ubicación seleccionada</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!position}
              onClick={() => position && onSelect(position.lat, position.lng)}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-150"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
