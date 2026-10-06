import { DndBasketballElement } from './DndBasketballElement.ts';

export interface RegisterDndBasketballOptions {
  /** Custom element name. Defaults to `dnd-basketball`. */
  tagName?: string | undefined;
}

export const DEFAULT_TAG_NAME = 'dnd-basketball';

/**
 * Defines the custom element. Idempotent, and a no-op where custom elements
 * do not exist (SSR), so it is safe to call from any module.
 */
export function registerDndBasketball(
  options: RegisterDndBasketballOptions = {}
): void {
  const tagName = options.tagName ?? DEFAULT_TAG_NAME;

  if (typeof customElements === 'undefined') return;
  if (customElements.get(tagName)) return;

  // A constructor can only be defined once per registry; other names get a subclass.
  customElements.define(
    tagName,
    tagName === DEFAULT_TAG_NAME
      ? DndBasketballElement
      : class extends DndBasketballElement {}
  );
}
