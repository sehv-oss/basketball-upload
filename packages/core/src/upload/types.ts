/**
 * - `ready`: accepted without an uploader; the file only travels with its form.
 * - `queued`: waiting for a free upload slot.
 * - `uploading` / `uploaded` / `error`: the uploader's progress and outcome.
 */
export type UploadStatus =
  'ready' | 'queued' | 'uploading' | 'uploaded' | 'error';

/**
 * A file in the basket and its upload. Items are immutable: every change
 * replaces the item with a new one, under the same `id`.
 */
export interface UploadItem {
  /**
   * Unique within the element, for `retryItem()` and `removeItem()`.
   */
  readonly id: string;

  readonly file: File;

  readonly status: UploadStatus;

  /**
   * From 0 to 1.
   */
  readonly progress: number;

  /**
   * Whatever the uploader resolved with.
   */
  readonly response: unknown;

  /**
   * Whatever the uploader rejected with.
   */
  readonly error: unknown;
}

/**
 * Second argument of an `Uploader`.
 */
export interface UploadContext {
  /**
   * Aborted when the item is removed or the queue is cleared.
   */
  readonly signal: AbortSignal;

  /**
   * `total` defaults to the size of the file.
   */
  readonly onProgress: (loaded: number, total?: number) => void;
}

/**
 * Sends one file. Resolve when it is stored, reject when it failed.
 */
export type Uploader = (file: File, context: UploadContext) => Promise<unknown>;
