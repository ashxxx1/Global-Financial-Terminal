#!/usr/bin/env node

/**
 * Build wrapper — Polyfill CustomEvent before Vite CLI runs
 * Fixes "CustomEvent is not defined" error in Node.js < 15
 */

// Polyfill CustomEvent globally
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, params = {}) {
      super(type, params);
      this.detail = params.detail;
    }
  };
}

// Now require and run vite build
import('vite').then(({ build }) => {
  build();
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
