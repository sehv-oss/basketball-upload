import { describe, expect, it } from 'vitest';

import { fileExtension, matchesAccept } from '../../src/upload/accept.ts';

const pdf = { name: 'final_final_v7.PDF', type: 'application/pdf' };
const png = { name: 'photo.png', type: 'image/png' };
const unknown = { name: 'notes', type: '' };

describe('matchesAccept', () => {
  it('accepts everything without an accept string', () => {
    expect(matchesAccept(pdf, '')).toBe(true);
    expect(matchesAccept(pdf, null)).toBe(true);
    expect(matchesAccept(unknown, undefined)).toBe(true);
  });

  it('matches extensions, case insensitively', () => {
    expect(matchesAccept(pdf, '.pdf')).toBe(true);
    expect(matchesAccept(png, '.pdf')).toBe(false);
  });

  it('matches exact MIME types and wildcards', () => {
    expect(matchesAccept(pdf, 'application/pdf')).toBe(true);
    expect(matchesAccept(png, 'image/*')).toBe(true);
    expect(matchesAccept(pdf, 'image/*')).toBe(false);
    expect(matchesAccept(unknown, '*/*')).toBe(true);
  });

  it('accepts a file matching any of a comma separated list', () => {
    expect(matchesAccept(png, ' .pdf , image/* ')).toBe(true);
    expect(matchesAccept(unknown, '.pdf,image/*')).toBe(false);
  });

  it('skips empty tokens, accepting everything when none is left', () => {
    expect(matchesAccept(png, '.pdf,,')).toBe(false);
    expect(matchesAccept(pdf, ',.pdf,')).toBe(true);
    expect(matchesAccept(png, ' , ')).toBe(true);
  });

  it('compares MIME types case insensitively', () => {
    expect(matchesAccept(png, 'IMAGE/PNG')).toBe(true);
    expect(matchesAccept({ name: 'a.png', type: 'Image/PNG' }, 'image/*')).toBe(
      true
    );
  });

  it('only matches extensions at the end of the name', () => {
    const disguised = { name: 'invoice.pdf.exe', type: '' };
    expect(matchesAccept(disguised, '.pdf')).toBe(false);
    expect(matchesAccept(disguised, 'application/pdf')).toBe(false);
  });

  it('does not match files without a type against MIME types', () => {
    expect(matchesAccept(unknown, 'application/octet-stream')).toBe(false);
    expect(matchesAccept(unknown, 'image/*')).toBe(false);
    expect(matchesAccept(unknown, '*')).toBe(true);
  });
});

describe('fileExtension', () => {
  it('returns the lowercase extension without the dot', () => {
    expect(fileExtension('final_final_v7.PDF')).toBe('pdf');
    expect(fileExtension('archive.tar.gz')).toBe('gz');
  });

  it('is empty for names without one', () => {
    expect(fileExtension('README')).toBe('');
    expect(fileExtension('.gitignore')).toBe('');
    expect(fileExtension('trailing.')).toBe('');
    expect(fileExtension('')).toBe('');
  });
});
