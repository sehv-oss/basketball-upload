import { BasketballUploadElement } from './basketball-upload-element.ts';

export interface RegisterBasketballUploadOptions {
  /**
   * Custom element name. Defaults to `basketball-upload`.
   */
  tagName?: string | undefined;
}

export const DEFAULT_TAG_NAME = 'basketball-upload';

/**
 * Defines the custom element. Idempotent, and a no-op where custom elements
 * do not exist (SSR), so it is safe to call from any module.
 */
export function registerBasketballUpload(
  options: RegisterBasketballUploadOptions = {}
): void {
  const tagName = options.tagName ?? DEFAULT_TAG_NAME;

  if (typeof customElements === 'undefined') return;
  if (customElements.get(tagName)) return;

  customElements.define(
    tagName,
    tagName === DEFAULT_TAG_NAME
      ? BasketballUploadElement
      : class extends BasketballUploadElement {}
  );
}
