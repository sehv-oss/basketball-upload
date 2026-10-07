import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import {
  configDefaults,
  defineConfig,
  defineProject,
  type Plugin,
} from 'vitest/config';

const coreSources = fileURLToPath(
  new URL('./packages/core/src/', import.meta.url)
);

function cssText(): Plugin {
  return {
    name: 'basketball-upload:css-text',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.endsWith('.css') || !importer?.startsWith(coreSources)) {
        return null;
      }

      return this.resolve(`${source}?raw`, importer, { skipSelf: true });
    },
  };
}

const alias = {
  '@sehv-oss/basketball-upload': `${coreSources}basketball-upload.ts`,
};

const browser = () => ({
  enabled: true,
  provider: playwright(),
  headless: true,
  screenshotFailures: false,
  instances: [{ browser: 'chromium' as const }],
});

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**'],
    },
    projects: [
      defineProject({
        test: {
          name: 'core',
          environment: 'node',
          include: ['packages/core/tests/**/*.test.ts'],
          exclude: [...configDefaults.exclude, '**/*.browser.test.ts'],
        },
      }),
      defineProject({
        plugins: [cssText()],
        test: {
          name: 'core-browser',
          include: ['packages/core/tests/**/*.browser.test.ts'],
          browser: browser(),
        },
      }),
      defineProject({
        plugins: [react(), cssText()],
        resolve: { alias },
        test: {
          name: 'react',
          include: ['packages/react/tests/**/*.test.tsx'],
          exclude: [...configDefaults.exclude, '**/*.ssr.test.tsx'],
          browser: browser(),
        },
      }),
      defineProject({
        plugins: [react(), cssText()],
        resolve: { alias },
        test: {
          name: 'react-ssr',
          environment: 'node',
          include: ['packages/react/tests/**/*.ssr.test.tsx'],
        },
      }),
    ],
  },
});
