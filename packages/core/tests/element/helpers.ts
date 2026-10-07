import { vi } from 'vitest';

import type { BasketballUploadElement } from '../../src/basketball-upload.ts';

export function mount(
  attributes: Record<string, string> = {},
  parent: HTMLElement = document.body
): BasketballUploadElement {
  document.body.style.margin = '0';
  const element = document.createElement('basketball-upload');
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  element.style.display = 'flex';
  element.style.inlineSize = '754px';
  element.style.blockSize = '887px';
  parent.append(element);
  return element;
}

export function shadow(element: BasketballUploadElement): ShadowRoot {
  if (!element.shadowRoot) throw new Error('No shadow root');

  return element.shadowRoot;
}

export function query<TElement extends Element = HTMLElement>(
  element: BasketballUploadElement,
  selector: string
): TElement {
  const found = shadow(element).querySelector<TElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);

  return found;
}

export function pdf(name = 'final_final_v7.pdf', size = 2_400): File {
  return new File([new Uint8Array(size)], name, { type: 'application/pdf' });
}

/**
 * A 24×24 PNG that decodes, for thumbnails.
 */
export async function png(name = 'photo.png'): Promise<File> {
  const canvas = new OffscreenCanvas(24, 24);
  canvas.getContext('2d')?.fillRect(0, 0, 24, 24);
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return new File([blob], name, { type: 'image/png' });
}

/**
 * Whether an object URL still gives its file: `false` once it is revoked.
 */
export async function stillResolves(url: string): Promise<boolean> {
  try {
    await fetch(url);
    return true;
  } catch {
    return false;
  }
}

export function nextEvent<TEvent extends Event = CustomEvent>(
  target: EventTarget,
  type: string,
  accept: (event: TEvent) => boolean = () => true
): Promise<TEvent> {
  return new Promise((resolve) => {
    const listener = (event: Event): void => {
      if (!accept(event as TEvent)) return;
      target.removeEventListener(type, listener);
      resolve(event as TEvent);
    };
    target.addEventListener(type, listener);
  });
}

export function center(element: Element): { x: number; y: number } {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

export function fileDrag(
  type: 'dragenter' | 'dragover' | 'drop',
  files: readonly File[],
  point: { x: number; y: number }
): DragEvent {
  const dataTransfer = new DataTransfer();
  for (const file of files) {
    dataTransfer.items.add(file);
  }

  return new DragEvent(type, {
    dataTransfer,
    clientX: point.x,
    clientY: point.y,
    bubbles: true,
    composed: true,
    cancelable: true,
  });
}

export function pointer(
  type:
    | 'pointerdown'
    | 'pointermove'
    | 'pointerup'
    | 'pointercancel'
    | 'lostpointercapture',
  point: { x: number; y: number },
  overrides: PointerEventInit = {}
): PointerEvent {
  return new PointerEvent(type, {
    pointerId: 7,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerdown' || type === 'pointermove' ? 1 : 0,
    clientX: point.x,
    clientY: point.y,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...overrides,
  });
}

export function keyboard(
  type: 'keydown' | 'keyup',
  key: string,
  overrides: KeyboardEventInit = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    key,
    bubbles: true,
    composed: true,
    cancelable: true,
    ...overrides,
  });
}

/**
 * Resolves after `milliseconds`, for animations that must have ended.
 */
export function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Pretends the user asked for reduced motion. Undo with `vi.unstubAllGlobals()`.
 */
export function stubReducedMotion(): void {
  const matchMedia = window.matchMedia.bind(window);
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('prefers-reduced-motion')
      ? { matches: true, media: query }
      : matchMedia(query)
  );
}
