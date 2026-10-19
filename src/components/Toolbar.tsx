import { NOTE_COLORS, type NoteColor } from '../notes/types'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  nextColor: NoteColor
  onPickColor(color: NoteColor): void
}

export function Toolbar({ nextColor, onPickColor }: ToolbarProps) {
  return (
    <header className={styles.toolbar}>
      <h1 className={styles.title}>Sticky Notes</h1>

      <div className={styles.colors} role="group" aria-label="Colour of new notes">
        {NOTE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={styles.swatch}
            data-color={color}
            aria-label={color}
            aria-pressed={color === nextColor}
            onClick={() => onPickColor(color)}
          />
        ))}
      </div>

      <p className={styles.hint}>
        Drag on the board to create · drag the top bar to move · drag the corner to resize
      </p>
    </header>
  )
}
