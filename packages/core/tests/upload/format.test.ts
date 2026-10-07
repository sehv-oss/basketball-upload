import { describe, expect, it } from 'vitest';

import { formatBytes } from '../../src/upload/format.ts';

describe('formatBytes', () => {
  it('uses decimal units, like file managers', () => {
    expect(formatBytes(2_400_000, 'en')).toBe('2.4 MB');
    expect(formatBytes(1_500, 'en')).toBe('1.5 KB');
    expect(formatBytes(3_200_000_000, 'en')).toBe('3.2 GB');
  });

  it('shows whole bytes below a kilobyte', () => {
    expect(formatBytes(0, 'en')).toBe('0 B');
    expect(formatBytes(999, 'en')).toBe('999 B');
  });

  it('follows the locale', () => {
    expect(formatBytes(2_400_000, 'pt-BR')).toBe('2,4 MB');
  });

  it('moves to the next unit when rounding reaches 1000', () => {
    expect(formatBytes(999_949, 'en')).toBe('999.9 KB');
    expect(formatBytes(999_950, 'en')).toBe('1 MB');
    expect(formatBytes(999_999_999, 'en')).toBe('1 GB');
    expect(formatBytes(999.5, 'en')).toBe('1 KB');
  });

  it('stops at terabytes', () => {
    expect(formatBytes(2_500_000_000_000_000, 'en')).toBe('2,500 TB');
  });

  it('shows negative and invalid sizes as zero', () => {
    expect(formatBytes(-5, 'en')).toBe('0 B');
    expect(formatBytes(Number.NaN, 'en')).toBe('0 B');
  });
});
