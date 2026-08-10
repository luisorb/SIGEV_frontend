import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export interface SearchableSelectOption {
  value: string
  label: string
  keywords?: string
  color?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const MAX_VISIBLE_OPTIONS = 100

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  error = false,
  disabled = false,
  size = 'md',
  className,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  )

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return options
    return options.filter(
      (o) =>
        normalize(o.label).includes(q) ||
        (o.keywords !== undefined && normalize(o.keywords).includes(q)),
    )
  }, [options, query])

  const visible = filtered.slice(0, MAX_VISIBLE_OPTIONS)

  function startEditing() {
    setEditing(true)
    setQuery('')
    setHighlight(0)
    setOpen(true)
  }

  function stopEditing() {
    setEditing(false)
    setOpen(false)
  }

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value)
    setQuery(option.label)
    setEditing(false)
    setOpen(false)
    setHighlight(0)
    inputRef.current?.blur()
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setHighlight(0)
    setOpen(true)
    setEditing(true)
    inputRef.current?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!editing) startEditing()
      setHighlight((h) => Math.min(h + 1, Math.max(visible.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open) {
        if (visible.length > 0) {
          selectOption(visible[Math.min(highlight, visible.length - 1)])
        }
      } else {
        startEditing()
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      stopEditing()
      inputRef.current?.blur()
    }
  }

  const isSm = size === 'sm'
  const iconClass = isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'

  const inputClasses = [
    'w-full',
    'border rounded-lg',
    'text-slate-900',
    'bg-white',
    'placeholder:text-slate-400',
    'focus:outline-none focus:ring-2',
    'transition-shadow duration-150',
    isSm ? 'pl-8 pr-8 py-1.5 text-xs' : 'pl-9 pr-9 py-2.5 text-sm',
    error
      ? 'border-red-300 focus:ring-red-300/40 focus:border-red-400'
      : 'border-slate-300 focus:ring-primary/30 focus:border-primary',
    disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : '',
  ].join(' ')

  return (
    <div ref={containerRef} className={['relative', className].filter(Boolean).join(' ')}>
      <div className="relative">
        <Search
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${iconClass} ${isSm ? 'left-2.5' : 'left-3'}`}
        />
        <input
          ref={inputRef}
          type="text"
          value={editing ? query : (selected?.label ?? '')}
          disabled={disabled}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlight(0)
            setEditing(true)
            setOpen(true)
          }}
          onFocus={startEditing}
          onBlur={stopEditing}
          onKeyDown={handleKeyDown}
          className={inputClasses}
        />
        <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${isSm ? 'right-2' : 'right-2.5'}`}>
          {value !== '' && !disabled && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Limpiar selección"
              tabIndex={-1}
            >
              <X className={iconClass} />
            </button>
          )}
          <ChevronDown
            className={`${iconClass} text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1"
        >
          {visible.map((option, index) => {
            const active = index === highlight
            const isSelected = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlight(index)}
                  className={[
                    'flex items-center gap-2 w-full px-3 py-2 text-left cursor-pointer',
                    isSm ? 'text-xs' : 'text-sm',
                    active ? 'bg-slate-100' : 'text-slate-700 hover:bg-slate-50',
                    isSelected ? 'font-medium text-primary' : '',
                  ].join(' ')}
                >
                  {option.color && (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="truncate flex-1">{option.label}</span>
                  {isSelected && <Check className={`${iconClass} text-primary shrink-0`} />}
                </button>
              </li>
            )
          })}
          {visible.length === 0 && (
            <li className={`px-3 py-2 text-slate-400 ${isSm ? 'text-xs' : 'text-sm'}`}>Sin resultados</li>
          )}
        </ul>
      )}
    </div>
  )
}
