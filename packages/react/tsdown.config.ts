import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { 'dnd-basketball-react': 'src/dnd-basketball-react.ts' },
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  dts: { sourcemap: true },
  sourcemap: true,
  clean: true,
  // The component uses hooks: React Server Components frameworks must load
  // it on the client. A directive in the sources would not survive bundling.
  banner: { js: "'use client';" },
});
