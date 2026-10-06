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
});
