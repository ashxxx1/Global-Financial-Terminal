/// <reference types="vite/client" />

/**
 * Without this, `import.meta.env` is untyped and `tsc --noEmit` reports 20+
 * phantom errors — which is why nobody ran it, which is why a real
 * `ReferenceError` shipped to production instead of failing the build.
 */
