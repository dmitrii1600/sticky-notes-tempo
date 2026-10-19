import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { usePointerDrag } from '../gestures/usePointerDrag'
import { useNotes } from '../notes/NotesContext'
import { DEFAULT_NOTE_SIZE, centerOn, containsPoint, rectFromCorners } from '../notes/geometry'
import type { NoteColor, Point, Rect } from '../notes/types'
import { StickyNote } from './StickyNote'
import { TrashZone, type TrashController, type TrashState } from './TrashZone'
import styles from './Board.module.css'

/** Movement under this many pixels is treated as a click, not as a drag. */
const CLICK_SLOP = 6

export function Board({ nextColor }: { nextColor: NoteColor }) {
  const { state, actions } = useNotes()
  const boardRef = useRef<HTMLDivElement>(null)
  const trashRef = useRef<HTMLDivElement>(null)

  // Both rects are read once per gesture instead of on every frame: neither the
  // board nor the trash zone can move while a drag is in progress.
  const boardRectRef = useRef<DOMRect | null>(null)
  const trashRectRef = useRef<DOMRect | null>(null)

  const [draft, setDraft] = useState<Rect | null>(null)
  const [trashState, setTrashState] = useState<TrashState>('idle')

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const observer = new ResizeObserver(() => {
      const { width, height } = board.getBoundingClientRect()
      actions.setBoardSize({ width, height })
    })
    observer.observe(board)
    return () => observer.disconnect()
  }, [actions])

  const trash = useMemo<TrashController>(() => {
    const isOver = (point: Point) => {
      const rect = trashRectRef.current
      return rect !== null && containsPoint(rect, point)
    }
    return {
      begin: () => {
        trashRectRef.current = trashRef.current?.getBoundingClientRect() ?? null
        setTrashState('active')
      },
      update: (point) => setTrashState(isOver(point) ? 'armed' : 'active'),
      end: (point) => {
        setTrashState('idle')
        return isOver(point)
      },
      cancel: () => setTrashState('idle'),
    }
  }, [])

  const toBoardPoint = (point: Point): Point => {
    const rect = boardRectRef.current
    return rect === null ? point : { x: point.x - rect.left, y: point.y - rect.top }
  }

  const startCreate = usePointerDrag({
    onStart: () => {
      boardRectRef.current = boardRef.current?.getBoundingClientRect() ?? null
    },
    onMove: ({ origin, current }) => {
      setDraft(rectFromCorners(toBoardPoint(origin), toBoardPoint(current)))
    },
    onEnd: ({ origin, current, delta }) => {
      setDraft(null)
      // Dragging sets both position and size at once; a plain click still has to
      // produce something, so it drops a default-sized note where the user clicked.
      const isClick = Math.abs(delta.x) < CLICK_SLOP && Math.abs(delta.y) < CLICK_SLOP
      const rect = isClick
        ? centerOn(toBoardPoint(origin), DEFAULT_NOTE_SIZE)
        : rectFromCorners(toBoardPoint(origin), toBoardPoint(current))
      actions.create(rect, nextColor)
    },
    onCancel: () => setDraft(null),
  })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Pointer events from notes bubble up here; only bare canvas creates a note.
    if (event.target !== event.currentTarget) return
    startCreate(event)
  }

  return (
    <main ref={boardRef} className={styles.board} onPointerDown={handlePointerDown}>
      {state.notes.map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          board={state.board}
          actions={actions}
          trash={trash}
        />
      ))}

      {draft && (
        <div
          className={styles.draft}
          style={{ left: draft.x, top: draft.y, width: draft.width, height: draft.height }}
        />
      )}

      {state.notes.length === 0 && !draft && (
        <p className={styles.hint}>Drag out a rectangle to create a note</p>
      )}

      <TrashZone ref={trashRef} state={trashState} />
    </main>
  )
}
