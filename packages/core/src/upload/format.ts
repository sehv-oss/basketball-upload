const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Human readable size in decimal units, the way file managers show it: `2_400_000` → `2.4 MB`.
 * `locale` formats the number (`2,4 MB` in `de`); it defaults to the runtime's.
 */
export function formatBytes(bytes: number, locale?: string): string {
  let value = bytes > 0 ? bytes : 0;
  let unit = 0;
  while (value >= (unit === 0 ? 999.5 : 999.95) && unit < UNITS.length - 1) {
    value /= 1000;
    unit += 1;
  }
  const number = new Intl.NumberFormat(locale, {
    maximumFractionDigits: unit === 0 ? 0 : 1,
  }).format(value);

  return `${number} ${UNITS[unit]}`;
}
