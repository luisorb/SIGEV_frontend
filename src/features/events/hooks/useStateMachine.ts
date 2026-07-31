import type { Event, EventState } from '../../../types'

export interface TransitionContext {
  attachmentsCount: number
  authorizeException?: boolean
}

export interface TransitionRule {
  to: EventState
  roles: string[]
  isDevolucion?: boolean
  isRechazo?: boolean
  validate: (event: Event, ctx: TransitionContext) => string | null
}

const TRANSITIONS: Record<EventState, TransitionRule[]> = {
  Postulado: [
    {
      to: 'En preparación',
      roles: ['operator', 'functional_admin'],
      validate: () => null,
    },
    {
      to: 'Devuelto',
      roles: ['approver', 'supervisor'],
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
  'En preparación': [
    {
      to: 'En revisión',
      roles: ['operator', 'functional_admin'],
      validate: (event) => {
        if (event.items.length === 0) return 'Debe tener al menos un ítem antes de enviar a revisión'
        return null
      },
    },
    {
      to: 'Devuelto',
      roles: ['approver', 'supervisor'],
      isDevolucion: true,
      validate: () => null,
    },
  ],
  'En revisión': [
    {
      to: 'En ejecución',
      roles: ['approver'],
      validate: (_event, ctx) => {
        if (ctx.attachmentsCount < 4 && !ctx.authorizeException) {
          return `Se requieren al menos 4 cotizaciones para aprobar (actual: ${ctx.attachmentsCount})`
        }
        return null
      },
    },
    {
      to: 'Devuelto',
      roles: ['approver', 'supervisor'],
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
  Devuelto: [
    {
      to: 'En preparación',
      roles: ['operator', 'analista', 'functional_admin'],
      validate: () => null,
    },
    {
      to: 'En revisión',
      roles: ['operator', 'functional_admin'],
      validate: (event) => {
        if (event.items.length === 0) return 'Debe tener al menos un ítem antes de enviar a revisión'
        return null
      },
    },
  ],
  'En ejecución': [
    {
      to: 'Cerrado',
      roles: ['approver'],
      validate: () => null,
    },
    {
      to: 'Devuelto',
      roles: ['supervisor'],
      isDevolucion: true,
      validate: () => null,
    },
  ],
  Cerrado: [
    {
      to: 'Legalizado',
      roles: ['approver'],
      validate: () => null,
    },
  ],
  Legalizado: [],
  Rechazado: [],
}

export function useStateMachine() {
  function getTransitionRules(state: EventState, roleNames: string[]): TransitionRule[] {
    return TRANSITIONS[state]?.filter((rule) => rule.roles.some((role) => roleNames.includes(role))) ?? []
  }

  function canTransition(from: EventState, to: EventState, roleNames: string[]): boolean {
    return getTransitionRules(from, roleNames).some((rule) => rule.to === to)
  }

  function validateTransition(event: Event, to: EventState, ctx: TransitionContext, roleNames: string[]): string | null {
    const rule = getTransitionRules(event.estado, roleNames).find((r) => r.to === to)
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

  function getAvailableTransitions(state: EventState, roleNames: string[]): EventState[] {
    return getTransitionRules(state, roleNames).map((rule) => rule.to)
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
