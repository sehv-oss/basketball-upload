import { readFile } from 'node:fs/promises';

import { defineConfig } from 'tsdown';
import type { TsdownPlugin } from 'tsdown';

/**
 * Imports `.css` files as plain strings, verbatim.
 *
 * The stylesheet is adopted by the Shadow DOM at runtime (`CSSStyleSheet`),
 * so nothing is emitted to `dist/` and no CSS pipeline is involved. The id is
 * suffixed with `?text` so it never reaches tsdown's CSS handling, which would
 * otherwise rewrite `@layer`, nesting and `light-dark()`.
 */
function cssText(): TsdownPlugin {
  const suffix = '?text';

  return {
    name: 'css-text',
    resolveId: {
      filter: { id: /\.css$/ },
      async handler(source, importer, options) {
        const resolved = await this.resolve(source, importer, options);
        if (!resolved) return null;
        return { ...resolved, id: `${resolved.id}${suffix}` };
      },
    },
    load: {
      filter: { id: /\.css\?text$/ },
      async handler(id) {
        const file = id.slice(0, -suffix.length);
        this.addWatchFile(file);
        const css = await readFile(file, 'utf8');
        return {
          code: `export default ${JSON.stringify(css)};`,
          moduleType: 'js',
        };
      },
    },
  };
}

export default defineConfig({
  entry: { 'dnd-basketball': 'src/dnd-basketball.ts' },
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  dts: { sourcemap: true },
  sourcemap: true,
  clean: true,
  plugins: [cssText()],
});
