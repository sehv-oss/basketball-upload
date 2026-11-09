import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { createServer, defineConfig, type Plugin } from 'vite';

const site = fileURLToPath(new URL('./', import.meta.url));
const packages = fileURLToPath(new URL('../packages/', import.meta.url));
const base = '/basketball-upload/';
const emptyRoot = '<div id="root"></div>';
const coreSources = `${packages}core/src/`;

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
      hotUpdate({ file }) {
        if (!file.startsWith(packages)) return undefined;
        this.environment.hot.send({ type: 'full-reload' });
        return [];
      },
    },
  ];
}

interface PrerenderModule {
  prerender: () => string;
}

/**
 * Writes the page into `index.html` at build time, so crawlers and link
 * previews get its content without running scripts. It renders with Vite's SSR
 * loader and without the source aliases, so from the packages' `dist/`, like
 * the rest of the build.
 */
function prerender(): Plugin {
  return {
    name: 'basketball-upload:prerender',
    apply: 'build',
    async transformIndexHtml(html) {
      if (!html.includes(emptyRoot)) {
        throw new Error(`index.html has no ${emptyRoot} to prerender into`);
      }

      const server = await createServer({
        configFile: false,
        root: site,
        base,
        mode: 'production',
        logLevel: 'warn',
        plugins: [react()],
        server: { middlewareMode: true, hmr: false, ws: false },
        appType: 'custom',
        optimizeDeps: { noDiscovery: true },
      });

      try {
        const { prerender: render } = (await server.ssrLoadModule(
          '/src/prerender.tsx'
        )) as PrerenderModule;
        const page = render();
        return html.replace(emptyRoot, () => `<div id="root">${page}</div>`);
      } finally {
        await server.close();
      }
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), librarySources(), prerender()],
  server: {
    open: true,
  },
});
