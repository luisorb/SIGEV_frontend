import type { StateHistoryEntry } from '../types'

let stateHistory: StateHistoryEntry[] = []

export function addStateHistoryEntry(entry: Omit<StateHistoryEntry, 'id'>): StateHistoryEntry {
  const newEntry: StateHistoryEntry = {
    id: `sh-${String(stateHistory.length + 1).padStart(3, '0')}`,
    ...entry,
  }
  stateHistory = [newEntry, ...stateHistory]
  return newEntry
}

export function getStateHistory(eventId?: string): StateHistoryEntry[] {
  if (eventId) return stateHistory.filter((e) => e.eventoId === eventId)
  return [...stateHistory]
}

export function getAllStateHistory(): StateHistoryEntry[] {
  return [...stateHistory]
}
