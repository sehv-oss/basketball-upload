import { describe, expect, it } from 'vitest';

import { extensionLabel } from '../../src/file-types/defaults.ts';
import { resolveFileType } from '../../src/file-types/registry.ts';

const file = (name: string, type = ''): File => new File([], name, { type });

describe('extensionLabel', () => {
  it('capitalizes the extension, keeping at most 4 characters', () => {
    expect(extensionLabel('notes.md', 'FILE')).toBe('MD');
    expect(extensionLabel('report.final.docx', 'FILE')).toBe('DOCX');
    expect(extensionLabel('design.sketchfile', 'FILE')).toBe('SKET');
  });

  it('uses the fallback without an extension', () => {
    expect(extensionLabel('Makefile', 'FILE')).toBe('FILE');
    expect(extensionLabel('.env', 'FILE')).toBe('FILE');
    expect(extensionLabel('trailing.', 'FILE')).toBe('FILE');
    expect(extensionLabel('', 'archive')).toBe('ARCH');
  });
});

describe('defaultFileTypes', () => {
  it('labels archives by their extension, gzipped tarballs as TGZ', () => {
    expect(resolveFileType(file('site.tar.gz')).label).toBe('TGZ');
    expect(resolveFileType(file('SITE.TAR.GZ')).label).toBe('TGZ');
    expect(resolveFileType(file('backup.7z')).label).toBe('7Z');
    expect(resolveFileType(file('download', 'application/zip'))).toMatchObject({
      kind: 'archive',
      label: 'ZIP',
    });
  });

  it('recognizes the other built-in kinds', () => {
    expect(resolveFileType(file('clip.mp4', 'video/mp4')).kind).toBe('video');
    expect(resolveFileType(file('song.mp3', 'audio/mpeg')).kind).toBe('audio');
    expect(resolveFileType(file('budget.xlsx')).kind).toBe('sheet');
    expect(resolveFileType(file('letter.docx')).kind).toBe('doc');
    expect(resolveFileType(file('pitch.key')).kind).toBe('slides');
    expect(resolveFileType(file('main.ts')).kind).toBe('code');
  });
});
