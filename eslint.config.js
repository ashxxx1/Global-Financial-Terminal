import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * Flat ESLint config (ESLint 9+/10 requires this file to exist, which is why
 * `eslint .` was hard-failing CI before it was added).
 *
 * Deliberately pragmatic: the correctness rules that catch real bugs stay as
 * errors; stylistic and taste rules that would flag the existing codebase are
 * relaxed to warnings or off. `eslint .` therefore exits 0 on clean code and
 * only breaks the build on a genuine defect, not on a matter of preference.
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "public/**",
      "src/data/**",       // large generated/static reference data, not hand-authored
      "scripts/**",        // node build scripts, different runtime/globals
      "api/**",            // edge functions, different runtime
      "server/**",         // legacy backend service
      ".cursor/**",        // vendored editor tooling (node scripts, not app source)
      ".claude/**",        // ditto
      "vite.config.js",    // build tooling (node globals)
      "eslint.config.js",  // this file
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // The two stable react-hooks rules only. react-hooks v7 also ships new
      // experimental rules (purity, set-state-in-effect, …) that flag valid,
      // working patterns across this codebase — not enabled here.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "off",
      // `any` is used intentionally at a few env/interop boundaries.
      "@typescript-eslint/no-explicit-any": "off",
      // Surface unused code as a warning (won't fail CI), and let intentional
      // unused args/vars be silenced with a leading underscore.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
);
