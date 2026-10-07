/**
 * The parts of a `File` that `matchesAccept` reads.
 */
export interface FileLike {
  readonly name: string;
  readonly type: string;
}

/**
 * Whether a file matches an `accept` string, with the semantics of
 * `<input type="file" accept>`: comma separated extensions (`.pdf`), MIME
 * types (`application/pdf`) and wildcards (`image/*`). Empty accepts all.
 */
export function matchesAccept(
  file: FileLike,
  accept: string | null | undefined
): boolean {
  const tokens = (accept ?? '')
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token === '*' || token === '*/*') return true;

    if (token.startsWith('.')) return name.endsWith(token);

    if (token.endsWith('/*')) return type.startsWith(token.slice(0, -1));

    return type === token;
  });
}

/**
 * Lowercase extension without the dot, or an empty string.
 */
export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1
    ? name.slice(dot + 1).toLowerCase()
    : '';
}
