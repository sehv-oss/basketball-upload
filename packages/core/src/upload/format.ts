const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Human readable size in decimal units, the way file managers show it: `2_400_000` → `2.4 MB`.
 */
export function formatBytes(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);

  return `${number} ${UNITS[unit]}`;
}
