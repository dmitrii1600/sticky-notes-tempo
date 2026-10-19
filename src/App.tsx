import { useState } from 'react'
import { Board } from './components/Board'
import { Toolbar } from './components/Toolbar'
import { NotesProvider } from './notes/NotesContext'
import type { NoteColor } from './notes/types'
import styles from './App.module.css'

export function App() {
  // The colour of the next note lives here because the toolbar picks it and the
  // board applies it; nothing else in the app cares about it.
  const [nextColor, setNextColor] = useState<NoteColor>('amber')

  return (
    <NotesProvider>
      <div className={styles.app}>
        <Toolbar nextColor={nextColor} onPickColor={setNextColor} />
        <Board nextColor={nextColor} />
      </div>
    </NotesProvider>
  )
}
