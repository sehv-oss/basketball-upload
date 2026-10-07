/**
 * What the body of a file card shows:
 * - `lines`: the paper with grey text lines of the design.
 * - `thumbnail`: a preview of the file itself (images), falling back to `lines`.
 * - a function: any node you build, placed in the `file-artwork` part.
 */
export type FileArtwork = 'lines' | 'thumbnail' | ((file: File) => Node);

/**
 * How files of one type look on the court and in the upload list.
 */
export interface FileType {
  /**
   * Stable id: lowercase letters, digits and dashes, starting with a letter.
   * Becomes the `data-kind` attribute, the parts `file-<kind>` and
   * `item-icon-<kind>`, and the token `--basketball-upload-file-<kind>`.
   */
  readonly kind: string;

  /**
   * `accept` syntax (`.pdf`, `application/pdf`, `image/*`, comma separated), or a predicate.
   */
  readonly match: string | ((file: File) => boolean);

  /**
   * Badge text. Defaults to the extension in capitals, at most 4 characters.
   */
  readonly label?: string | ((file: File) => string) | undefined;

  /**
   * Badge color: any CSS color, `light-dark()` included.
   */
  readonly color?: string | undefined;

  /**
   * Defaults to `lines`.
   */
  readonly artwork?: FileArtwork | undefined;
}

/**
 * A file type applied to one file, as `resolveFileType` returns it: every
 * default filled in.
 */
export interface ResolvedFileType {
  /**
   * `kind` of the matching type, or `file` when none matched.
   */
  readonly kind: string;

  /**
   * Badge text for this file.
   */
  readonly label: string;

  /**
   * `null` uses the neutral `--basketball-upload-file-badge` token.
   */
  readonly color: string | null;

  /**
   * What the body of the card shows.
   */
  readonly artwork: FileArtwork;
}
