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
  });
});
