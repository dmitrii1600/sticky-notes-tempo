import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { notesReducer, type NotesState } from './reducer'
import { loadState, saveState } from './storage'
import { createNoteId, type NoteColor, type NoteId, type Point, type Rect, type Size } from './types'

const SAVE_DELAY_MS = 300

export interface NotesActions {
  create(rect: Rect, color: NoteColor): void
  move(id: NoteId, position: Point): void
  resize(id: NoteId, size: Size): void
  remove(id: NoteId): void
  edit(id: NoteId, text: string): void
  recolor(id: NoteId, color: NoteColor): void
  raise(id: NoteId): void
  setBoardSize(size: Size): void
}

interface NotesContextValue {
  readonly state: NotesState
  readonly actions: NotesActions
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notesReducer, null, loadState)

  // dispatch is stable, so every consumer keeps the same actions object for the
  // lifetime of the app and memoised notes do not re-render on unrelated updates.
  const actions = useMemo<NotesActions>(
    () => ({
      create: (rect, color) => dispatch({ type: 'note/created', id: createNoteId(), rect, color }),
      move: (id, position) => dispatch({ type: 'note/moved', id, position }),
      resize: (id, size) => dispatch({ type: 'note/resized', id, size }),
      remove: (id) => dispatch({ type: 'note/removed', id }),
      edit: (id, text) => dispatch({ type: 'note/edited', id, text }),
      recolor: (id, color) => dispatch({ type: 'note/recolored', id, color }),
      raise: (id) => dispatch({ type: 'note/raised', id }),
      setBoardSize: (size) => dispatch({ type: 'board/resized', size }),
    }),
    [],
  )

  // Debounced so typing in a note does not hit localStorage on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => saveState(state), SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [state])

  const value = useMemo(() => ({ state, actions }), [state, actions])

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export function useNotes(): NotesContextValue {
  const value = useContext(NotesContext)
  if (!value) throw new Error('useNotes must be used inside NotesProvider')
  return value
}
