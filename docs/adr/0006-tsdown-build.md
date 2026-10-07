# ADR 0006 — tsdown build, development from sources

**Status:** accepted

## Context

The organization's `web/lib` TypeScript preset is `noEmit`: a web library goes through a bundler. The core must embed its CSS as strings, verbatim (cascade layers, nesting and `light-dark()` must reach the Shadow DOM untouched), and the React package must start with `'use client'`.

## Decision

tsdown produces `dist/`.

```text
package build = tsc -p tsconfig.json && tsc -p tsconfig.tests.json && tsdown
```

- The core's `tsdown.config.ts` carries the `cssText()` plugin: `.css` imports resolve to `?text` ids loaded as `export default "<css>"`, bypassing any CSS pipeline.
- The React package adds `'use client'` with tsdown's `banner`: a directive in the sources would not survive bundling.
- Type checks of sources and tests are chained in the build, because the reusable CI workflows run `pnpm build`.

In development, nothing is bundled. The site (`pnpm site:dev`) serves both packages from `src/` with Vite aliases, loads the core's CSS with `?raw`, and reloads the page when a package changes (a defined custom element cannot be hot-swapped). Its production build consumes `dist/` through `exports`, so the deployed site runs the published packages. The tests run against the sources too.

## Consequences

- Relative imports carry `.ts` extensions, as the presets require.
- `dist/` holds one `.js` and one `.d.ts` per package, with source maps.
- tsdown's API is pre-1.0; the build itself validates the options.
