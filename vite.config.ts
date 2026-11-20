import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { characterPdfPlugin } from './scripts/character-pdf-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(process.env.ELANORIA_CHATGPT === '1' ? [characterPdfPlugin()] : [])],
})
