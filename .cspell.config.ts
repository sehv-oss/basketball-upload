import { defineConfig } from 'cspell';

export default defineConfig({
  import: ['@sehv-oss/cspell-config'],
  ignorePaths: ['pnpm-lock.yaml', 'CHANGELOG.md', 'site/src/demo/messages.ts'],
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
    'unstub',
    'uploaders',
  ],
});
