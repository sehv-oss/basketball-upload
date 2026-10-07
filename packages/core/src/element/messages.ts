/**
 * Why a file was turned away:
 * - `type`: it does not match `accept`.
 * - `size`: it is larger than `max-size`.
 * - `count`: it is one file more than `max-files` allows, or than one without
 *   `multiple`.
 */
export type RejectReason = 'type' | 'size' | 'count';

/**
 * Visible copy and accessible names. The defaults are the copy of the
 * reference design; override any of them with the `messages` property, or the
 * first four with slots.
 */
export interface Messages {
  /**
   * Heading of the element. The `title` slot replaces it.
   */
  title: string;

  /**
   * Line under the heading. The `description` slot replaces it.
   */
  description: string;

  /**
   * Main text of the dropzone. The `prompt` slot replaces it.
   */
  prompt: string;

  /**
   * Text under the prompt. The `hint` slot replaces it.
   */
  hint: string;

  /**
   * Accessible name of the dropzone button.
   */
  dropzone: string;

  /**
   * Label of the pill that counts the files in the basket.
   */
  counter: string;

  /**
   * Accessible name of a card waiting on the court.
   */
  shoot: (name: string) => string;

  /**
   * Status of a file in the basket when there is no uploader.
   */
  ready: string;

  /**
   * Status of a file waiting for a free upload slot.
   */
  queued: string;

  /**
   * Status of a file being uploaded.
   */
  uploading: string;

  /**
   * Status of a file the uploader stored.
   */
  uploaded: string;

  /**
   * Status of a file whose upload failed.
   */
  failed: string;

  /**
   * Accessible name and tooltip of the retry button of a row.
   */
  retry: (name: string) => string;

  /**
   * Accessible name of the progress bar of a row.
   */
  progress: (name: string) => string;

  /**
   * Validation message when `required` and empty.
   */
  required: string;

  /**
   * Announced when a file goes through the net.
   */
  scored: (name: string) => string;

  /**
   * Announced when a shot misses.
   */
  missed: (name: string) => string;

  /**
   * Announced when a file is turned away.
   */
  rejected: (name: string, reason: RejectReason) => string;

  /**
   * Announced when an upload succeeds.
   */
  complete: (name: string) => string;

  /**
   * Announced when an upload fails.
   */
  error: (name: string) => string;
}

/**
 * The copy of the reference design, in English.
 */
export const defaultMessages: Messages = {
  title: 'Upload files',
  description: 'Drag and drop, or take the shot.',
  prompt: 'Drop files here',
  hint: 'or take the shot',
  dropzone: 'Choose files to upload',
  counter: 'Uploaded',
  shoot: (name) => `Shoot ${name}`,
  ready: 'Ready',
  queued: 'Waiting…',
  uploading: 'Uploading…',
  uploaded: 'Uploaded',
  failed: 'Upload failed',
  retry: (name) => `Retry ${name}`,
  progress: (name) => `${name} upload progress`,
  required: 'Add at least one file.',
  scored: (name) => `${name}: nothing but net.`,
  missed: (name) => `Missed ${name}. Take the shot again.`,
  rejected: (name, reason) =>
    reason === 'type'
      ? `${name} is not an accepted file type.`
      : reason === 'size'
        ? `${name} is too large.`
        : `${name} is one file too many.`,
  complete: (name) => `${name} uploaded.`,
  error: (name) => `${name} failed to upload.`,
};
