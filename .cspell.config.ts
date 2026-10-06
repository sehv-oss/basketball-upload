import { defineConfig } from 'cspell';

export default defineConfig({
  import: ['@sehv-oss/cspell-config', '@sehv-oss/cspell-config/pt-br'],
  ignorePaths: ['pnpm-lock.yaml', 'CHANGELOG.md'],
  words: [
    'dnd',
    'fieldsets',
    'figma',
    'Fuster',
    'fuster',
    'jetbrains',
    'jorgemolinafuster',
    'Molina',
    'presign',
    'sehv',
    'shiki',
    'Shiki',
    'theming',
    'uploaders',
  ],
});
