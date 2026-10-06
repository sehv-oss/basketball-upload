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
      name: 'basketball-upload:sources',
      apply: 'serve',
      config: () => ({
        resolve: {
          alias: [
            {
              find: /^@sehv-oss\/basketball-upload$/,
              replacement: `${coreSources}basketball-upload.ts`,
            },
            {
              find: /^@sehv-oss\/basketball-upload-react$/,
              replacement: `${packages}react/src/basketball-upload-react.ts`,
            },
          ],
        },
      }),
    },
    {
      name: 'basketball-upload:css-text',
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
      name: 'basketball-upload:reload',
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
  // Served from https://sehv-oss.github.io/basketball-upload/
  base: '/basketball-upload/',
  plugins: [react(), librarySources()],
});
