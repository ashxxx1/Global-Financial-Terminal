/**
 * Progressive web app registration — growth-plan item 69.
 *
 * The manifest already existed; what was missing was the service worker, which
 * is what actually makes the app installable and gives it an offline shell.
 *
 * Registration is deliberately deferred until after load. A service worker
 * registered during startup competes with the first data fetches for
 * connections, and on a market terminal the prices matter more than the
 * install banner.
 */

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let listeners: ((available: boolean) => void)[] = [];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  // Dev serves modules unbundled; a worker caching them fights HMR.
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* an unavailable worker must never break the app */
    });
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    // Chrome shows its own bar unless we take the event; taking it lets us ask
    // at a moment that makes sense rather than on first paint.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l(true));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((l) => l(false));
  });
}

export const installAvailable = (): boolean => deferredPrompt !== null;

export function onInstallAvailability(fn: (available: boolean) => void): () => void {
  listeners.push(fn);
  return () => { listeners = listeners.filter((l) => l !== fn); };
}

/** Show the browser's install prompt. Returns whether the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((l) => l(false));
  return outcome === "accepted";
}
