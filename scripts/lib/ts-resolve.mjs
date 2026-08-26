/**
 * Lets build scripts import the app's own TypeScript modules.
 *
 * Node 24 strips types on its own, but it will not guess extensions, and the
 * app is written with Vite's extensionless imports ("./feeds/yahooSymbols").
 * Rather than duplicate the registries in the build scripts — which is how the
 * sitemap and the app drift apart — this teaches Node the one resolution rule
 * it is missing.
 *
 * Usage: node --import ./scripts/lib/ts-resolve.mjs scripts/whatever.mjs
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CANDIDATES = [".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.js"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      // Only relative/absolute specifiers get the extension search; a bare
      // package name that fails to resolve is a genuine missing dependency.
      if (!specifier.startsWith(".") && !specifier.startsWith("/")) throw err;
      for (const ext of CANDIDATES) {
        try {
          const url = new URL(specifier + ext, context.parentURL);
          if (existsSync(fileURLToPath(url))) return nextResolve(specifier + ext, context);
        } catch { /* try the next extension */ }
      }
      throw err;
    }
  },
});
