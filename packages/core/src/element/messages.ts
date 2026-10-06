export type RejectReason = 'type' | 'size' | 'count';

/**
 * Visible copy and accessible names. The defaults are the copy of the
 * reference design; override any of them with the `messages` property, or the
 * first four with slots.
 */
export interface Messages {
  title: string;
  description: string;
  prompt: string;
  hint: string;
  /** Accessible name of the dropzone button. */
  dropzone: string;
  counter: string;
  /** Accessible name of a card waiting on the court. */
  shoot: (name: string) => string;
  ready: string;
  queued: string;
  uploading: string;
  uploaded: string;
  failed: string;
  retry: (name: string) => string;
  progress: (name: string) => string;
  /** Validation message when `required` and empty. */
  required: string;
  scored: (name: string) => string;
  missed: (name: string) => string;
  rejected: (name: string, reason: RejectReason) => string;
  complete: (name: string) => string;
  error: (name: string) => string;
}

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
