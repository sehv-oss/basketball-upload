import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { 'basketball-upload-react': 'src/basketball-upload-react.ts' },
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  dts: { sourcemap: true },
  sourcemap: true,
  clean: true,
  banner: { js: "'use client';" },
});
