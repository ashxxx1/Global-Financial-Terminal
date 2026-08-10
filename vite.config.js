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

/** Local-dev stand-in for Vercel /api/* functions (quote + candles via Finnhub). */
function localFinnhubApi() {
  return {
    name: 'gft-local-finnhub-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/quote') && !url.startsWith('/api/candles')) return next()

        const key = process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY || ''
        const send = (status, body) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }

        if (!key) return send(501, { error: 'not configured' })

        try {
          const u = new URL(url, 'http://localhost')
          const symbol = (u.searchParams.get('symbol') || '').toUpperCase()
          if (!/^[A-Z0-9.\-]{1,12}$/.test(symbol)) return send(400, { error: 'bad symbol' })

          if (url.startsWith('/api/quote')) {
            const upstream = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`,
              { signal: AbortSignal.timeout(8000) },
            )
            if (upstream.status === 429) return send(429, { error: 'rate limited' })
            if (!upstream.ok) return send(502, { error: `upstream ${upstream.status}` })
            const q = await upstream.json()
            return send(200, { c: q.c, dp: q.dp })
          }

          // /api/candles
          const resolution = (u.searchParams.get('resolution') || 'D').toUpperCase()
          const from = Number(u.searchParams.get('from') || '0')
          const to = Number(u.searchParams.get('to') || '0')
          if (!['1', '5', '15', '30', '60', 'D', 'W', 'M'].includes(resolution)) {
            return send(400, { error: 'bad resolution' })
          }
          if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0 || from >= to) {
            return send(400, { error: 'bad from/to' })
          }
          const upstream = await fetch(
            `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}` +
              `&resolution=${encodeURIComponent(resolution)}&from=${Math.floor(from)}&to=${Math.floor(to)}&token=${key}`,
            { signal: AbortSignal.timeout(12000) },
          )
          if (upstream.status === 429) return send(429, { error: 'rate limited' })
          if (!upstream.ok) return send(502, { error: `upstream ${upstream.status}` })
          const raw = await upstream.json()
          if (raw.s === 'no_data' || !raw.t?.length) {
            return send(200, { candles: [], source: 'live', status: 'no_data' })
          }
          if (raw.s !== 'ok') return send(502, { error: `upstream status ${raw.s || 'unknown'}` })
          const candles = raw.t.map((t, i) => ({
            t: t * 1000,
            o: raw.o[i],
            h: raw.h[i],
            l: raw.l[i],
            c: raw.c[i],
            v: raw.v?.[i] ?? 0,
          }))
          return send(200, { candles, source: 'live', status: 'ok' })
        } catch (err) {
          return send(502, { error: err instanceof Error ? err.message : 'fetch failed' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Root path by default (Vercel/Netlify/tunnel); GitHub Pages project sites
  // build with VITE_BASE=/Global-Financial-Terminal/ (see .github/workflows/pages.yml).
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss(), localFinnhubApi()],
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
          // Charts: Stock trading chart + signal recharts pages.
          if (/[\\/]node_modules[\\/](lightweight-charts|fancy-canvas|recharts|d3-[^\\/]+|victory-[^\\/]+)[\\/]/.test(id)) return 'charts'
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
