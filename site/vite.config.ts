import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const packages = fileURLToPath(new URL('../packages/', import.meta.url));
const coreSources = `${packages}core/src/`;

/**
 * Development only: the site runs the packages from their TypeScript
 * sources, with no build step. The one thing the tsdown build does at bundle
 * time, loading the core's `.css` files as strings, is reproduced with
 * Vite's `?raw`.
 *
 * `vite build` is left alone: the published site consumes `dist/` through
 * `package.json#exports`, which keeps the public API boundary exercised.
 */
function librarySources(): Plugin[] {
  return [
    {
      name: 'dnd-basketball:sources',
      apply: 'serve',
      config: () => ({
        resolve: {
          alias: [
            {
              find: /^@sehv-oss\/dnd-basketball$/,
              replacement: `${coreSources}dnd-basketball.ts`,
            },
            {
              find: /^@sehv-oss\/dnd-basketball-react$/,
              replacement: `${packages}react/src/dnd-basketball-react.ts`,
            },
          ],
        },
      }),
    },
    {
      name: 'dnd-basketball:css-text',
      apply: 'serve',
      enforce: 'pre',
      resolveId(source, importer) {
        if (!source.endsWith('.css') || !importer?.startsWith(coreSources)) {
          return null;
        }
        return this.resolve(`${source}?raw`, importer, { skipSelf: true });
      },
    },
    {
      name: 'dnd-basketball:reload',
      apply: 'serve',
      // A defined custom element cannot be swapped for a re-evaluated class,
      // so a change in a package reloads the page instead of hot-updating.
      hotUpdate({ file }) {
        if (!file.startsWith(packages)) return undefined;
        this.environment.hot.send({ type: 'full-reload' });
        return [];
      },
    },
  ];
}

export default defineConfig({
  // Served from https://sehv-oss.github.io/dnd-basketball/
  base: '/dnd-basketball/',
  plugins: [react(), librarySources()],
});
