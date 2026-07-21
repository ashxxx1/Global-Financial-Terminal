import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

// Polyfill CustomEvent for Node.js build environment
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, params) {
      super(type)
      this.detail = params?.detail
    }
  }
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  // Root path by default (Vercel/Netlify/tunnel); GitHub Pages project sites
  // build with VITE_BASE=/Global-Financial-Terminal/ (see .github/workflows/pages.yml).
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  preview: {
    // Allow tunneled hosts (e.g. *.lhr.life) so the built app can be shared
    // for auditing via `vite preview` behind a public tunnel.
    allowedHosts: true,
  },
})
