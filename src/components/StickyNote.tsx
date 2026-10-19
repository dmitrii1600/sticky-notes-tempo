import { memo, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { usePointerDrag } from '../gestures/usePointerDrag'
import { placeWithin, resizeWithin } from '../notes/geometry'
import type { NotesActions } from '../notes/NotesContext'
import { NOTE_COLORS, type Note, type Point, type Rect, type Size } from '../notes/types'
import type { TrashController } from './TrashZone'
import styles from './StickyNote.module.css'

interface StickyNoteProps {
  note: Note
  board: Size
  actions: NotesActions
  trash: TrashController
}

/**
 * Receives everything through props rather than through the notes context, so
 * memoisation actually holds: editing one note does not re-render the others.
 */
export const StickyNote = memo(function StickyNote({ note, board, actions, trash }: StickyNoteProps) {
  // A running gesture previews itself locally and commits once, on release.
  // That is one dispatch per gesture instead of one per pointer frame.
  const [preview, setPreview] = useState<Rect | null>(null)

  const startMove = usePointerDrag({
    onStart: () => trash.begin(),
    onMove: ({ delta, current }) => {
      setPreview(movedRect(note.rect, delta, board))
      trash.update(current)
    },
    onEnd: ({ delta, current }) => {
      setPreview(null)
      if (trash.end(current)) {
        actions.remove(note.id)
        return
      }
      const { x, y } = movedRect(note.rect, delta, board)
      actions.move(note.id, { x, y })
    },
    onCancel: () => {
      setPreview(null)
      trash.cancel()
    },
  })

  const startResize = usePointerDrag({
    onMove: ({ delta }) => setPreview(resizedRect(note.rect, delta, board)),
    onEnd: ({ delta }) => {
      const { width, height } = resizedRect(note.rect, delta, board)
      setPreview(null)
      actions.resize(note.id, { width, height })
    },
    onCancel: () => setPreview(null),
  })

  const rect = preview ?? note.rect
  const style: CSSProperties = {
    left: note.rect.x,
    top: note.rect.y,
    width: rect.width,
    height: rect.height,
    zIndex: note.z,
    // Moving is applied as a transform: it keeps the drag off the layout path.
    ...(preview
      ? { transform: `translate(${rect.x - note.rect.x}px, ${rect.y - note.rect.y}px)` }
      : null),
  }

  return (
    <article
      className={styles.note}
      style={style}
      data-color={note.color}
      data-dragging={preview ? 'true' : undefined}
      onPointerDown={() => actions.raise(note.id)}
    >
      <header className={styles.header} onPointerDown={startMove}>
        <div className={styles.palette}>
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.swatch}
              data-color={color}
              aria-label={`Use ${color} paper`}
              aria-pressed={color === note.color}
              onPointerDown={stopPropagation}
              onClick={() => actions.recolor(note.id, color)}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.remove}
          aria-label="Delete note"
          onPointerDown={stopPropagation}
          onClick={() => actions.remove(note.id)}
        >
          ×
        </button>
      </header>

      <textarea
        className={styles.text}
        value={note.text}
        placeholder="Write something"
        spellCheck={false}
        onChange={(event) => actions.edit(note.id, event.target.value)}
      />

      <span
        className={styles.grip}
        role="presentation"
        title="Drag to resize"
        onPointerDown={startResize}
      />
    </article>
  )
})

function movedRect(rect: Rect, delta: Point, board: Size): Rect {
  return placeWithin({ ...rect, x: rect.x + delta.x, y: rect.y + delta.y }, board)
}

function resizedRect(rect: Rect, delta: Point, board: Size): Rect {
  return resizeWithin({ ...rect, width: rect.width + delta.x, height: rect.height + delta.y }, board)
}

// Controls inside the header must not start a move gesture.
function stopPropagation(event: ReactPointerEvent) {
  event.stopPropagation()
}
