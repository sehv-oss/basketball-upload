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

export function query<T extends Element = HTMLElement>(
  element: BasketballUploadElement,
  selector: string
): T {
  const found = shadow(element).querySelector<T>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);

  return found;
}

export function pdf(name = 'final_final_v7.pdf', size = 2_400): File {
  return new File([new Uint8Array(size)], name, { type: 'application/pdf' });
}

export function nextEvent<T extends Event = CustomEvent>(
  target: EventTarget,
  type: string,
  accept: (event: T) => boolean = () => true
): Promise<T> {
  return new Promise((resolve) => {
    const listener = (event: Event): void => {
      if (!accept(event as T)) return;
      target.removeEventListener(type, listener);
      resolve(event as T);
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
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  point: { x: number; y: number }
): PointerEvent {
  return new PointerEvent(type, {
    pointerId: 7,
    pointerType: 'mouse',
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    clientX: point.x,
    clientY: point.y,
    bubbles: true,
    composed: true,
    cancelable: true,
  });
}
