import type { Event, EventState } from '../../../types'

export interface TransitionContext {
  quotationsCount: number
  authorizeException?: boolean
}

export interface TransitionRule {
  to: EventState
  roles: string[]
  isDevolucion?: boolean
  isRechazo?: boolean
  isAllowed?: (event: Event) => boolean
  validate: (event: Event, ctx: TransitionContext) => string | null
}

function origenDevuelto(event: Event): EventState | null {
  return (event.devueltoDesde as EventState | null) ?? (event.devolucionLegalizacion ? 'Cerrado' : null)
}

const TRANSITIONS: Record<EventState, TransitionRule[]> = {
  Abierto: [
    {
      to: 'En ejecución',
      roles: ['approver'],
      validate: () => null,
    },
    {
      to: 'Devuelto',
      roles: ['approver'],
      isDevolucion: true,
      validate: () => null,
    },
    {
      to: 'Rechazado',
      roles: ['approver'],
      isRechazo: true,
      validate: () => null,
    },
  ],
  'En ejecución': [
    {
      to: 'Ejecutado',
      roles: ['approver'],
      validate: (event) => {
        if (event.items.length === 0) return 'Debe tener al menos un ítem antes de marcar como ejecutado'
        return null
      },
    },
    {
      to: 'Devuelto',
      roles: ['approver'],
      isDevolucion: true,
      validate: () => null,
    },
    {
      to: 'Rechazado',
      roles: ['approver'],
      isRechazo: true,
      validate: () => null,
    },
  ],
  Ejecutado: [
    {
      to: 'Cerrado',
      roles: ['approver'],
      validate: () => null,
    },
    {
      to: 'Devuelto',
      roles: ['approver'],
      isDevolucion: true,
      validate: () => null,
    },
  ],
  Devuelto: [
    {
      to: 'Abierto',
      roles: ['approver'],
      isAllowed: (event) => origenDevuelto(event) === 'Abierto',
      validate: () => null,
    },
    {
      to: 'En ejecución',
      roles: ['approver'],
      isAllowed: (event) => {
        const origin = origenDevuelto(event)
        return origin === 'En ejecución' || origin === null
      },
      validate: () => null,
    },
    {
      to: 'Ejecutado',
      roles: ['approver'],
      isAllowed: (event) => origenDevuelto(event) === 'Ejecutado',
      validate: () => null,
    },
    {
      to: 'Cerrado',
      roles: ['approver'],
      isAllowed: (event) => {
        const origin = origenDevuelto(event)
        return origin === 'Cerrado' || origin === null
      },
      validate: () => null,
    },
  ],
  Cerrado: [
    {
      to: 'Legalizado',
      roles: ['approver'],
      validate: () => null,
    },
    {
      to: 'Devuelto',
      roles: ['approver'],
      isDevolucion: true,
      validate: () => null,
    },
  ],
  Legalizado: [],
  Rechazado: [],
}

export function useStateMachine() {
  function getTransitionRules(
    state: EventState,
    roleNames: string[],
    event?: Event,
  ): TransitionRule[] {
    return (
      TRANSITIONS[state]?.filter(
        (rule) =>
          rule.roles.some((role) => roleNames.includes(role)) &&
          (!rule.isAllowed || (event ? rule.isAllowed(event) : true)),
      ) ?? []
    )
  }

  function canTransition(
    from: EventState | Event,
    to: EventState,
    roleNames: string[],
  ): boolean {
    const state = typeof from === 'string' ? from : from.estado
    const event = typeof from === 'string' ? undefined : from
    return getTransitionRules(state, roleNames, event).some(
      (rule) => rule.to === to,
    )
  }

  function validateTransition(event: Event, to: EventState, ctx: TransitionContext, roleNames: string[]): string | null {
    const rule = getTransitionRules(event.estado, roleNames, event).find((r) => r.to === to)
    if (!rule) {
      return `Su rol no permite pasar de "${event.estado}" a "${to}"`
    }
    return rule.validate(event, ctx)
  }

  function isDevolucion(from: EventState, to: EventState): boolean {
    return TRANSITIONS[from]?.some((rule) => rule.to === to && rule.isDevolucion) ?? false
  }

  function isRechazo(from: EventState, to: EventState): boolean {
    return TRANSITIONS[from]?.some((rule) => rule.to === to && rule.isRechazo) ?? false
  }

  function isTerminal(state: EventState): boolean {
    return (TRANSITIONS[state]?.length ?? 0) === 0
  }

  function getAvailableTransitions(state: EventState, roleNames: string[], event?: Event): EventState[] {
    return getTransitionRules(state, roleNames, event).map((rule) => rule.to)
  }

  return {
    getTransitionRules,
    canTransition,
    validateTransition,
    isDevolucion,
    isRechazo,
    isTerminal,
    getAvailableTransitions,
  }
}
