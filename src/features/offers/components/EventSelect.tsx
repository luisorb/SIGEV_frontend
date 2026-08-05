import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ChevronDown, X, Check, MapPin } from 'lucide-react'
import type { Event } from '../../../types'
import { useMunicipalities } from '../../../hooks/useMunicipalities'

interface EventSelectProps {
  value: string
  events: Event[]
  onChange: (eventId: string) => void
  error?: string
}

const eventStateColors: Record<string, string> = {
  Abierto: 'bg-yellow-100 text-yellow-800',
  'En ejecución': 'bg-blue-100 text-blue-800',
  Ejecutado: 'bg-orange-100 text-orange-800',
  Cerrado: 'bg-slate-100 text-slate-800',
  Legalizado: 'bg-purple-100 text-purple-800',
  Devuelto: 'bg-amber-100 text-amber-800',
  Rechazado: 'bg-rose-100 text-rose-800',
}

export function EventSelect({ value, events, onChange, error }: EventSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: municipios = [] } = useMunicipalities()

  const selected = events.find((e) => e.id === value) ?? null

  function municipioName(id: string): string {
    const m = municipios.find((m) => m.id === id)
    return m ? m.nombre : id
  }

  function eventLabel(ev: Event): string {
    return `${ev.numeroEvento}${ev.sufijo ? `-${ev.sufijo}` : ''}`
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return events
      .filter((ev) =>
        `${eventLabel(ev)} ${ev.responsable} ${ev.estado} ${municipioName(ev.municipioId)}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 50)
  }, [events, query, municipios])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={
            selected ? `${eventLabel(selected)} · ${selected.responsable}` : 'Buscar evento por número, responsable o municipio...'
          }
          className={`w-full pl-9 pr-9 py-2 border rounded-lg text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-150 ${
            error ? 'border-red-400' : 'border-slate-300'
          }`}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Abrir lista de eventos"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-slate-500">
              {query.trim() ? 'No se encontraron eventos' : 'Escribe el número, responsable o municipio para buscar'}
            </li>
          ) : (
            filtered.map((ev) => {
              const isSelected = ev.id === value
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(ev.id)
                      setOpen(false)
                      setQuery('')
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{eventLabel(ev)}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${eventStateColors[ev.estado] || 'bg-slate-100 text-slate-700'}`}>
                          {ev.estado}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        {ev.responsable}
                        <span className="text-slate-300">·</span>
                        <MapPin className="w-3 h-3 shrink-0" />
                        {municipioName(ev.municipioId)}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}

      {selected && !open && (
        <div className="mt-2 flex items-start justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{eventLabel(selected)}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {selected.responsable} · {municipioName(selected.municipioId)} · {selected.estado}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange('')
              setQuery('')
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
            title="Quitar evento asociado"
            aria-label="Quitar evento asociado"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
