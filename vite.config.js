import { defineConfig, loadEnv } from 'vite'
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
      // Vite loads .env.local for the client, not for this config, so the dev
      // API middleware would otherwise always answer "not configured".
      const env = loadEnv('development', process.cwd(), '')
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/quote') && !url.startsWith('/api/candles') && !url.startsWith('/api/research') && !url.startsWith('/api/intl-quotes')) return next()

        const key = process.env.FINNHUB_API_KEY || env.FINNHUB_API_KEY || env.VITE_FINNHUB_API_KEY || ''
        const send = (status, body) => {
          res.statusCode = status
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(body))
        }

        try {
          const u = new URL(url, 'http://localhost')

          // /api/intl-quotes — mirrors api/intl-quotes.ts. Batched local-exchange
          // prices; no key needed, so it works in dev out of the box.
          if (url.startsWith('/api/intl-quotes')) {
            const SUBUNIT = { GBp: 100, ZAc: 100, ILA: 100, KWF: 1000 }
            const list = (u.searchParams.get('symbols') || '').split(',').map((x) => x.trim()).filter(Boolean)
            if (!list.length || list.length > 20) return send(400, { error: 'bad symbols' })
            if (list.some((x) => !/^[A-Za-z0-9.\-^]{1,16}$/.test(x))) return send(400, { error: 'bad symbol' })
            const up = await fetch(
              `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${list.map(encodeURIComponent).join(',')}&range=5d&interval=1d`,
              { headers: { 'user-agent': 'Mozilla/5.0 (compatible; GFTTerminal/1.0)', accept: 'application/json' }, signal: AbortSignal.timeout(12000) },
            )
            if (!up.ok) return send(502, { error: `upstream ${up.status}` })
            const body = await up.json()
            const quotes = {}
            for (const e of body?.spark?.result ?? []) {
              const m = e?.response?.[0]?.meta
              if (!(m?.regularMarketPrice > 0)) continue
              const div = SUBUNIT[m.currency] ?? 1
              const prev = m.chartPreviousClose
              quotes[e.symbol] = {
                p: m.regularMarketPrice / div,
                dp: prev > 0 ? ((m.regularMarketPrice - prev) / prev) * 100 : 0,
                cur: m.currency || '',
                at: (m.regularMarketTime ?? 0) * 1000,
              }
            }
            return send(200, { quotes, fetchedAt: Date.now() })
          }
          const symbol = (u.searchParams.get('symbol') || '').toUpperCase()
          // Market-wide datasets take no symbol; mirror api/research.ts so dev
          // and production reject and accept exactly the same calls.
          const symbolOptional = url.startsWith('/api/research') && /dataset=earnings-calendar/.test(url)
          if (!symbolOptional && !/^[A-Z0-9.\-]{1,12}$/.test(symbol)) return send(400, { error: 'bad symbol' })
          if (symbolOptional && symbol && !/^[A-Z0-9.\-]{1,12}$/.test(symbol)) return send(400, { error: 'bad symbol' })

          // /api/research — mirrors api/research.ts so the research engine is
          // testable locally. Same dataset table, same validation; no cache
          // headers because the dev server is not a CDN.
          if (url.startsWith('/api/research')) {
            if (!key) return send(501, { error: 'not configured' })
            const today = new Date().toISOString().slice(0, 10)
            const ago = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
            const DATASETS = {
              profile: `/stock/profile2?symbol=${symbol}`,
              metrics: `/stock/metric?symbol=${symbol}&metric=all`,
              recommendations: `/stock/recommendation?symbol=${symbol}`,
              earnings: `/stock/earnings?symbol=${symbol}`,
              news: `/company-news?symbol=${symbol}&from=${ago(14)}&to=${today}`,
              filings: `/stock/filings?symbol=${symbol}`,
              peers: `/stock/peers?symbol=${symbol}`,
              'earnings-calendar': `/calendar/earnings?from=${today}&to=${new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10)}`,
              insider: `/stock/insider-transactions?symbol=${symbol}`,
            }
            const dataset = u.searchParams.get('dataset') || ''
            const pathFor = DATASETS[dataset]
            if (!pathFor) return send(400, { error: 'unknown dataset' })
            // earnings-calendar is market-wide and takes no symbol.
            const upstream = await fetch(
              `https://finnhub.io/api/v1${pathFor}&token=${key}`.replace('?&', '?'),
              { signal: AbortSignal.timeout(12000) },
            )
            if (upstream.status === 429) return send(429, { error: 'rate limited' })
            if (upstream.status === 403) return send(403, { error: 'premium dataset', dataset })
            if (!upstream.ok) return send(502, { error: `upstream ${upstream.status}` })
            return send(200, { dataset, symbol, data: await upstream.json(), fetchedAt: Date.now() })
          }

          if (url.startsWith('/api/quote')) {
            if (!key) return send(501, { error: 'not configured' })
            const upstream = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`,
              { signal: AbortSignal.timeout(8000) },
            )
            if (upstream.status === 429) return send(429, { error: 'rate limited' })
            if (!upstream.ok) return send(502, { error: `upstream ${upstream.status}` })
            const q = await upstream.json()
            return send(200, { c: q.c, dp: q.dp })
          }

          // /api/candles — Finnhub free tier blocks candles (403); fall back to Yahoo.
          const resolution = (u.searchParams.get('resolution') || 'D').toUpperCase()
          const from = Number(u.searchParams.get('from') || '0')
          const to = Number(u.searchParams.get('to') || '0')
          if (!['1', '5', '15', '30', '60', 'D', 'W', 'M'].includes(resolution)) {
            return send(400, { error: 'bad resolution' })
          }
          if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0 || from >= to) {
            return send(400, { error: 'bad from/to' })
          }

          if (key) {
            try {
              const upstream = await fetch(
                `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(symbol)}` +
                  `&resolution=${encodeURIComponent(resolution)}&from=${Math.floor(from)}&to=${Math.floor(to)}&token=${key}`,
                { signal: AbortSignal.timeout(12000) },
              )
              if (upstream.status === 429) return send(429, { error: 'rate limited' })
              if (upstream.ok) {
                const raw = await upstream.json()
                if (raw.s === 'ok' && raw.t?.length) {
                  const candles = raw.t.map((t, i) => ({
                    t: t * 1000, o: raw.o[i], h: raw.h[i], l: raw.l[i], c: raw.c[i], v: raw.v?.[i] ?? 0,
                  }))
                  return send(200, { candles, source: 'live', provider: 'finnhub', status: 'ok' })
                }
                if (raw.s === 'no_data') {
                  // fall through to Yahoo
                } else if (upstream.status !== 403) {
                  // fall through
                }
              }
            } catch { /* Yahoo fallback */ }
          }

          const yahooInterval = ({ 1: '1m', 5: '5m', 15: '15m', 30: '30m', 60: '60m', W: '1wk', M: '1mo' })[resolution] || '1d'
          let period1 = Math.floor(from)
          let period2 = Math.floor(to)
          if (['1m', '5m', '15m', '30m', '60m'].includes(yahooInterval)) {
            const maxSpan = yahooInterval === '1m' ? 7 * 86400 : 60 * 86400
            period1 = Math.max(period1, period2 - maxSpan)
          }
          const yUrl =
            `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
            `?period1=${period1}&period2=${period2}&interval=${yahooInterval}&includePrePost=false`
          const yUp = await fetch(yUrl, {
            signal: AbortSignal.timeout(12000),
            headers: { 'user-agent': 'Mozilla/5.0 (compatible; GFTTerminal/1.0)', accept: 'application/json' },
          })
          if (yUp.status === 429) return send(429, { error: 'rate limited' })
          if (!yUp.ok) return send(502, { error: `yahoo ${yUp.status}` })
          const yRaw = await yUp.json()
          const result = yRaw.chart?.result?.[0]
          const ts = result?.timestamp
          const q = result?.indicators?.quote?.[0]
          if (!ts?.length || !q) return send(200, { candles: [], source: 'delayed', provider: 'yahoo', status: 'no_data' })
          const candles = []
          for (let i = 0; i < ts.length; i++) {
            const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i]
            if (o == null || h == null || l == null || c == null) continue
            candles.push({ t: ts[i] * 1000, o, h, l, c, v: q.volume?.[i] ?? 0 })
          }
          return send(200, { candles, source: 'delayed', provider: 'yahoo', status: candles.length ? 'ok' : 'no_data' })
        } catch (err) {
          return send(502, { error: err instanceof Error ? err.message : 'fetch failed' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  /**
   * Which deployment this bundle is. Vercel sets VERCEL_ENV to production,
   * preview or development; it is not VITE_-prefixed, so it is inlined here.
   * The app shows a banner on anything that is not production — a preview URL
   * looks identical to the real thing otherwise, and someone reading a price
   * off a staging build has no way to know it is not the live terminal.
   */
  define: {
    __DEPLOY_ENV__: JSON.stringify(process.env.VERCEL_ENV || "development"),
    __DEPLOY_REF__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_REF || ""),
    __DEPLOY_SHA__: JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7)),
  },
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
