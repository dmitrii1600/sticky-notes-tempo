export interface Point {
  readonly x: number
  readonly y: number
}

export interface Size {
  readonly width: number
  readonly height: number
}

export interface Rect extends Point, Size {}

export const NOTE_COLORS = ['amber', 'rose', 'mint', 'sky'] as const

export type NoteColor = (typeof NOTE_COLORS)[number]

// Branded so an arbitrary string cannot be passed where a note id is expected.
export type NoteId = string & { readonly __brand: 'NoteId' }

export interface Note {
  readonly id: NoteId
  readonly rect: Rect
  readonly color: NoteColor
  readonly text: string
  readonly z: number
}

export function createNoteId(): NoteId {
  return crypto.randomUUID() as NoteId
}
