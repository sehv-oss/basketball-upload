import { defineConfig } from 'cspell';

export default defineConfig({
  import: ['@sehv-oss/cspell-config', '@sehv-oss/cspell-config/pt-br'],
  ignorePaths: ['pnpm-lock.yaml', 'CHANGELOG.md'],
  words: [
    'dnd',
    'fieldsets',
    'figma',
    'fuster',
    'jetbrains',
    'jorgemolinafuster',
    'molina',
    'presign',
    'sehv',
    'shiki',
    'sket',
    'sketchfile',
    'theming',
    'uploaders',
  ],
});
