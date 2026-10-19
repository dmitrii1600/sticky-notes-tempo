import type { Ref } from 'react'
import type { Point } from '../notes/types'
import styles from './TrashZone.module.css'

export type TrashState = 'idle' | 'active' | 'armed'

/**
 * The board owns the trash geometry, a dragged note only reports where the
 * pointer is. This keeps hit testing in one place instead of in every note.
 */
export interface TrashController {
  begin(): void
  update(point: Point): void
  /** Returns true when the note was released over the zone and should be deleted. */
  end(point: Point): boolean
  cancel(): void
}

interface TrashZoneProps {
  state: TrashState
  ref?: Ref<HTMLDivElement>
}

export function TrashZone({ state, ref }: TrashZoneProps) {
  return (
    <div ref={ref} className={styles.zone} data-state={state} aria-hidden="true">
      <svg viewBox="0 0 24 24" className={styles.icon} focusable="false">
        <path
          fill="currentColor"
          d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9Zm4 2v9h2v-9h-2Zm4 0v9h2v-9h-2Z"
        />
      </svg>
      <span className={styles.label}>Drop here to delete</span>
    </div>
  )
}
