import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAP_CENTER, MAP_ZOOM } from '../../map/utils/mapConfig'
import { MapPin, X } from 'lucide-react'

interface MapViewerProps {
  latitud: number
  longitud: number
  municipio?: string
  onClose: () => void
}

export function MapViewer({ latitud, longitud, municipio, onClose }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const hasCoords =
      latitud !== undefined && latitud !== null && String(latitud).trim() !== '' && Number.isFinite(Number(latitud)) &&
      longitud !== undefined && longitud !== null && String(longitud).trim() !== '' && Number.isFinite(Number(longitud))

    const center: L.LatLngExpression = hasCoords
      ? [Number(latitud), Number(longitud)]
      : [MAP_CENTER.lat, MAP_CENTER.lng]

    const map = L.map(containerRef.current, {
      center,
      zoom: hasCoords ? 15 : MAP_ZOOM,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    if (hasCoords) {
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:22px;height:22px;background:#E11D48;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
      L.marker([Number(latitud), Number(longitud)], { icon, interactive: false }).addTo(map)
    }

    mapRef.current = map
    const t = window.setTimeout(() => map.invalidateSize(), 80)

    return () => {
      window.clearTimeout(t)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasCoords =
    latitud !== undefined && latitud !== null && String(latitud).trim() !== '' && Number.isFinite(Number(latitud)) &&
    longitud !== undefined && longitud !== null && String(longitud).trim() !== '' && Number.isFinite(Number(longitud))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Ubicación del evento</h3>
              {municipio && <p className="text-xs text-slate-500 mt-0.5">{municipio}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={containerRef} className="h-[400px] w-full relative z-0" />

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-primary" />
            {hasCoords ? (
              <span className="font-medium text-slate-800">
                {Number(latitud).toFixed(6)}, {Number(longitud).toFixed(6)}
              </span>
            ) : (
              <span>Sin coordenadas registradas</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
