import { afterEach, describe, expect, it } from 'vitest';

import {
  registerFileType,
  resolveFileType,
} from '../../src/file-types/registry.ts';

const file = (name: string, type = ''): File => new File([], name, { type });

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

describe('resolveFileType', () => {
  it('knows PDFs, with the color of the design', () => {
    expect(
      resolveFileType(file('final_final_v7.pdf', 'application/pdf'))
    ).toEqual({
      kind: 'pdf',
      label: 'PDF',
      color: '#d8374e',
      artwork: 'lines',
    });
  });

  it('shows images as thumbnails, labelled by their extension', () => {
    expect(resolveFileType(file('photo.jpeg', 'image/jpeg'))).toMatchObject({
      kind: 'image',
      label: 'JPEG',
      artwork: 'thumbnail',
    });
  });

  it('falls back to a neutral file labelled by its extension', () => {
    expect(resolveFileType(file('design.sketchfile'))).toEqual({
      kind: 'file',
      label: 'SKET',
      color: null,
      artwork: 'lines',
    });
    expect(resolveFileType(file('Makefile')).label).toBe('FILE');
  });
});

describe('registerFileType', () => {
  it('wins over the built-in types, and can be removed', () => {
    cleanups.push(
      registerFileType({
        kind: 'invoice',
        match: '.pdf',
        label: 'INV',
        color: 'teal',
      })
    );
    expect(resolveFileType(file('march.pdf')).kind).toBe('invoice');

    cleanups.pop()?.();
    expect(resolveFileType(file('march.pdf')).kind).toBe('pdf');
  });

  it('lets the most recent registration win', () => {
    cleanups.push(registerFileType({ kind: 'first', match: '.fig' }));
    cleanups.push(registerFileType({ kind: 'second', match: '.fig' }));

    expect(resolveFileType(file('board.fig')).kind).toBe('second');
  });

  it('loses to the types of an element', () => {
    cleanups.push(registerFileType({ kind: 'global', match: '.fig' }));
    const types = [
      { kind: 'local', match: (f: File) => f.name.endsWith('.fig') },
    ];

    expect(resolveFileType(file('board.fig'), types).kind).toBe('local');
  });

  it('computes labels from the file when given a function', () => {
    cleanups.push(
      registerFileType({
        kind: 'figma',
        match: '.fig',
        label: (f) => f.name.split('.')[0]!.slice(0, 3).toUpperCase(),
        artwork: () => new Text('custom') as unknown as Node,
      })
    );
    const resolved = resolveFileType(file('board.fig'));

    expect(resolved.label).toBe('BOA');
    expect(typeof resolved.artwork).toBe('function');
  });

  it('rejects kinds that cannot be part names', () => {
    expect(() => registerFileType({ kind: 'My Type', match: '.x' })).toThrow(
      TypeError
    );
    expect(() => registerFileType({ kind: '1st', match: '.x' })).toThrow(
      TypeError
    );
  });
});
