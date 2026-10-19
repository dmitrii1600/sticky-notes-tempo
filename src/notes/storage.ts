import { EMPTY_STATE, type NotesState } from './reducer'
import { NOTE_COLORS, type Note, type NoteColor, type Rect } from './types'

const STORAGE_KEY = 'sticky-notes:v1'

/** Board size is derived from the viewport on every load, so it is not persisted. */
type PersistedState = Pick<NotesState, 'notes' | 'topZ'>

export function loadState(): NotesState {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private mode and locked-down profiles can throw on access; an empty board is a fine fallback.
    return EMPTY_STATE
  }
  if (raw === null) return EMPTY_STATE

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isPersistedState(parsed)) return EMPTY_STATE
    return { ...EMPTY_STATE, notes: parsed.notes, topZ: parsed.topZ }
  } catch {
    return EMPTY_STATE
  }
}

export function saveState(state: NotesState): void {
  const payload: PersistedState = { notes: state.notes, topZ: state.topZ }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or storage disabled. Losing persistence must not break the board.
  }
}

// Anything coming back from storage is untrusted: a stale or hand-edited entry
// would otherwise crash the render with undefined coordinates.
function isPersistedState(value: unknown): value is PersistedState {
  if (!isRecord(value)) return false
  return typeof value.topZ === 'number' && Array.isArray(value.notes) && value.notes.every(isNote)
}

function isNote(value: unknown): value is Note {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.z === 'number' &&
    isNoteColor(value.color) &&
    isRect(value.rect)
  )
}

function isRect(value: unknown): value is Rect {
  if (!isRecord(value)) return false
  return (['x', 'y', 'width', 'height'] as const).every((key) => Number.isFinite(value[key]))
}

function isNoteColor(value: unknown): value is NoteColor {
  return NOTE_COLORS.some((color) => color === value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
