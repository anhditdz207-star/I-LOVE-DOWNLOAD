import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// VITE_BASE = "/<repo-name>/" when deploying to GitHub Pages
export default defineConfig({ base: process.env.VITE_BASE ?? '/', plugins: [react(), tailwindcss()] })
