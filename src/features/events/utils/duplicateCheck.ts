import type { Event } from '../../../types'

export function checkDuplicateEventNumber(
  events: Event[],
  numeroEvento: string,
  sufijo: string,
  excludeId?: string,
): Event | undefined {
  return events.find(
    (e) =>
      e.numeroEvento === numeroEvento &&
      e.sufijo === sufijo &&
      e.id !== excludeId,
  )
}
