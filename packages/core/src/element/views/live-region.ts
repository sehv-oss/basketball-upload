import { createElement } from '../dom.ts';

export interface LiveRegionView {
  readonly element: HTMLElement;
  announce(message: string): void;
}

/**
 * Polite announcements for what only shows as motion: scores, misses, uploads.
 */
export function createLiveRegion(): LiveRegionView {
  const element = createElement('div', {
    class: 'visually-hidden',
    role: 'status',
    'aria-live': 'polite',
  });
  let frame = 0;

  return {
    element,
    announce(message) {
      element.textContent = '';
      if (typeof requestAnimationFrame !== 'function') {
        element.textContent = message;
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.textContent = message;
      });
    },
  };
}
