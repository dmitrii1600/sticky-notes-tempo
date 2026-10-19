import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  // The app is published as a GitHub Pages project site, so it is served from
  // /<repo>/ rather than from the domain root. Keeping the same base in dev and
  // preview means the asset paths behave identically everywhere.
  base: '/sticky-notes-tempo/',
  plugins: [react()],
})
