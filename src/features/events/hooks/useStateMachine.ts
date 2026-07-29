import type { Event, EventState, Soporte } from '../../../types'
import { SOPORTES_REQUERIDOS } from '../../../types'

interface TransitionRule {
  allowed: EventState[]
  validate: (event: Event, offersCount?: number) => string | null
}

const RULES: Record<EventState, TransitionRule> = {
  Abierto: {
    allowed: ['En ejecucion'],
    validate: (event) => {
      if (!event.asignadoA) return 'Debe asignar un operador logístico antes de iniciar ejecución'
      if (!event.aliadoId) return 'Debe seleccionar un aliado'
      if (!event.desembolsoId) return 'Debe seleccionar un desembolso'
      if (!event.responsable) return 'Debe especificar un responsable'
      return null
    },
  },
  'En ejecucion': {
    allowed: ['Ejecutado', 'Abierto'],
    validate: (event) => {
      if (event.items.length === 0) return 'Debe tener al menos un ítem antes de marcar como ejecutado'
      return null
    },
  },
  Ejecutado: {
    allowed: ['Cerrado'],
    validate: (event, offersCount) => {
      if (!offersCount || offersCount === 0) return 'No hay ofertas económicas asociadas a este evento'
      if (offersCount < 3) return `Debe tener al menos 3 cotizaciones (actual: ${offersCount})`
      if (!event.cotizacionSeleccionadaId) return 'Debe seleccionar la oferta económica aprobada'
      return null
    },
  },
  Cerrado: {
    allowed: ['Legalizado', 'Ejecutado'],
    validate: (event) => {
      if (!event.soportes || event.soportes.length === 0) return 'Debe cargar los soportes documentales'
      const tiposCargados = event.soportes.map((s: Soporte) => s.tipo)
      const faltantes = SOPORTES_REQUERIDOS.filter((t) => !tiposCargados.includes(t))
      if (faltantes.length > 0) return `Faltan soportes obligatorios: ${faltantes.join(', ')}`
      return null
    },
  },
  Legalizado: {
    allowed: [],
    validate: () => null,
  },
}

export function useStateMachine() {
  function canTransition(from: EventState, to: EventState): boolean {
    return RULES[from].allowed.includes(to)
  }

  function validateTransition(event: Event, to: EventState, offersCount?: number): string | null {
    if (!canTransition(event.estado, to)) {
      return `No se permite la transición de "${event.estado}" a "${to}"`
    }
    return RULES[event.estado].validate(event, offersCount)
  }

  function isTerminal(state: EventState): boolean {
    return RULES[state].allowed.length === 0
  }

  function getAvailableTransitions(state: EventState): EventState[] {
    return RULES[state].allowed
  }

  function isDevolucion(from: EventState, to: EventState): boolean {
    return (
      (from === 'Cerrado' && to === 'Ejecutado') ||
      (from === 'En ejecucion' && to === 'Abierto')
    )
  }

  return {
    canTransition,
    validateTransition,
    isTerminal,
    getAvailableTransitions,
    isDevolucion,
  }
}
