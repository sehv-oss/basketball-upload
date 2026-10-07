import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const packages = fileURLToPath(new URL('../packages/', import.meta.url));
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

export default defineConfig({
  base: '/basketball-upload/',
  plugins: [react(), librarySources()],
});
