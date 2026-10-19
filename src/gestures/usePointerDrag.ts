import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Point } from '../notes/types'

export interface DragState {
  /** Where the gesture started, in client coordinates. */
  readonly origin: Point
  readonly current: Point
  readonly delta: Point
}

export interface DragCallbacks {
  onStart?(drag: DragState, event: ReactPointerEvent): void
  onMove?(drag: DragState): void
  onEnd?(drag: DragState): void
  onCancel?(): void
}

interface Session {
  readonly pointerId: number
  readonly origin: Point
  current: Point
  frame: number
}

/**
 * Turns a pointerdown into a full drag gesture. Everything the board does -
 * creating, moving and resizing - is built on this one hook.
 *
 * Coordinates stay in client space: the hook knows nothing about the board, so
 * callers convert where they need to (moving and resizing only need the delta).
 */
export function usePointerDrag(callbacks: DragCallbacks) {
  const latest = useRef(callbacks)
  useEffect(() => {
    latest.current = callbacks
  })

  const session = useRef<Session | null>(null)
  const detach = useRef<(() => void) | null>(null)

  useEffect(() => () => detach.current?.(), [])

  return useCallback((event: ReactPointerEvent) => {
    if (event.button !== 0 || session.current) return

    const origin: Point = { x: event.clientX, y: event.clientY }
    const active: Session = { pointerId: event.pointerId, origin, current: origin, frame: 0 }
    session.current = active

    // Capture keeps the gesture alive when the cursor outruns the element, and
    // the window listeners keep it alive when it leaves the window entirely.
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.dataset.dragging = 'true'

    const flush = () => {
      active.frame = 0
      latest.current.onMove?.(toDragState(active))
    }

    const handleMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== active.pointerId) return
      active.current = { x: moveEvent.clientX, y: moveEvent.clientY }
      // Pointer events can arrive several times per frame; collapse them into one update.
      if (active.frame === 0) active.frame = requestAnimationFrame(flush)
    }

    const handleEnd = (endEvent: PointerEvent) => {
      if (endEvent.pointerId !== active.pointerId) return
      stop()
      if (endEvent.type === 'pointercancel') {
        latest.current.onCancel?.()
        return
      }
      active.current = { x: endEvent.clientX, y: endEvent.clientY }
      latest.current.onEnd?.(toDragState(active))
    }

    const stop = () => {
      if (active.frame !== 0) cancelAnimationFrame(active.frame)
      delete document.body.dataset.dragging
      session.current = null
      detach.current = null
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
    }

    detach.current = stop
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)

    latest.current.onStart?.(toDragState(active), event)
  }, [])
}

function toDragState(session: Session): DragState {
  return {
    origin: session.origin,
    current: session.current,
    delta: {
      x: session.current.x - session.origin.x,
      y: session.current.y - session.origin.y,
    },
  }
}
