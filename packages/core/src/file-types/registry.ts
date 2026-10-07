import { matchesAccept } from '../upload/accept.ts';
import { defaultFileTypes, extensionLabel } from './defaults.ts';
import type { FileType, ResolvedFileType } from './types.ts';

const KIND = /^[a-z][a-z0-9-]*$/;

/**
 * Registered globally, most recent first.
 */
const registered: FileType[] = [];

/**
 * Throws when a file type cannot be used: its kind ends up in part names.
 */
export function assertFileType(type: FileType): void {
  if (!KIND.test(type.kind)) {
    throw new TypeError(
      `Invalid file type kind "${type.kind}": use lowercase letters, digits and dashes, starting with a letter.`
    );
  }
}

/**
 * Adds a file type for every `<basketball-upload>` on the page. It wins over the
 * built-in types and over the ones registered before it; types set on an
 * element (`fileTypes`) still win over it. Returns a function that removes it.
 */
export function registerFileType(type: FileType): () => void {
  assertFileType(type);
  registered.unshift(type);
  return () => {
    const index = registered.indexOf(type);
    if (index !== -1) registered.splice(index, 1);
  };
}

function matches(type: FileType, file: File): boolean {
  return typeof type.match === 'function'
    ? type.match(file)
    : matchesAccept(file, type.match);
}

function resolve(type: FileType, file: File): ResolvedFileType {
  const label =
    typeof type.label === 'function'
      ? type.label(file)
      : (type.label ?? extensionLabel(file.name, type.kind));
  return {
    kind: type.kind,
    label,
    color: type.color ?? null,
    artwork: type.artwork ?? 'lines',
  };
}

/**
 * The look of a file: the first match among `instanceTypes`, then the
 * registered types, then the built-in ones, then a neutral `file`.
 */
export function resolveFileType(
  file: File,
  instanceTypes: readonly FileType[] = []
): ResolvedFileType {
  for (const types of [instanceTypes, registered, defaultFileTypes]) {
    for (const type of types) {
      if (matches(type, file)) return resolve(type, file);
    }
  }
  return {
    kind: 'file',
    label: extensionLabel(file.name, 'FILE'),
    color: null,
    artwork: 'lines',
  };
}
