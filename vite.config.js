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
    // Keep a single React instance for any third-party component libraries.
    dedupe: ['react', 'react-dom'],
  },
  preview: {
    // Allow tunneled hosts (e.g. *.lhr.life) so the built app can be shared
    // for auditing via `vite preview` behind a public tunnel.
    allowedHosts: true,
  },
  build: {
    // Split the heavy vendors out of the entry chunk. Without this everything
    // ships as one ~900KB gzipped file, so a visitor who only ever sees the
    // landing page still downloads three.js, recharts and firebase before
    // first paint — which is both a Core Web Vitals and an SEO problem.
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) requires the function form.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // The globe: by far the largest dependency, and only the World page
          // and the landing hero need it.
          if (/[\\/]node_modules[\\/](three|globe\.gl|react-globe\.gl)[\\/]/.test(id)) return 'globe'
          // Charts: only the Stock/Country pages.
          if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-[^\\/]+)[\\/]/.test(id)) return 'charts'
          // Auth + database: not needed until the user signs in.
          if (/[\\/]node_modules[\\/](firebase|@firebase)[\\/]/.test(id)) return 'firebase'
          // Analytics: deferred, never blocking.
          if (/[\\/]node_modules[\\/]posthog-js[\\/]/.test(id)) return 'analytics'
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
        },
      },
    },
    // The globe chunk is legitimately large; warn above that rather than on
    // every build so the signal stays meaningful.
    chunkSizeWarningLimit: 900,
  },
})
