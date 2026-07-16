#!/usr/bin/env node

/**
 * Build setup script — Ensures CustomEvent polyfill exists before Vite runs
 * This fixes Node.js < 20 compatibility issues
 */

// Polyfill CustomEvent for Node.js < 15
if (typeof CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends Event {
    constructor(type, params = {}) {
      super(type, params);
      this.detail = params.detail;
    }
  };
}

// Now run Vite
import { spawn } from 'child_process';

const child = spawn('vite', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_OPTIONS: '--input-type=module' }
});

child.on('exit', (code) => {
  process.exit(code);
});
