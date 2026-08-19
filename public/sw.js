/**
 * Service worker — growth-plan item 69.
 *
 * Deliberately conservative about what it caches. This is a market terminal:
 * serving a stale quote from a cache would break the one promise the product
 * makes, so /api/* is never cached here and always goes to the network. The
 * edge already caches those responses with TTLs chosen per dataset.
 *
 * What it does cache is the app shell, so the terminal opens instantly and
 * shows a real offline page rather than the browser's dinosaur.
 */

const VERSION = "gft-v3";
const SHELL = `${VERSION}-shell`;

/** Only the entry document; hashed build assets are handled at runtime. */
const SHELL_URLS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Market data must never be served from a cache. A price that looks live and
  // is an hour old is worse than no price at all.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network first so a deploy is picked up immediately, with the
  // cached shell as the offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Build assets are content-hashed, so a cache hit is always correct.
  if (/\.(js|css|woff2?|png|svg|webp|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); }
          return res;
        }),
      ),
    );
  }
});
