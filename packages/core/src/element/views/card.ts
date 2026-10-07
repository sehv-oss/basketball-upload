import type { ResolvedFileType } from '../../file-types/types.ts';
import { createElement } from '../dom.ts';
import { poseStyle, type Pose } from '../motion.ts';

/**
 * The CSS color of a file type: its token when set, its own color otherwise.
 */
export function fileColor(type: ResolvedFileType): string {
  return `var(--basketball-upload-file-${type.kind}, ${type.color ?? 'var(--_file-badge)'})`;
}

export interface Artwork {
  readonly element: HTMLElement;
  dispose(): void;
}

function lines(): HTMLElement[] {
  return Array.from({ length: 3 }, () =>
    createElement('span', { class: 'line' })
  );
}

/**
 * The body of a file card: text lines, a thumbnail, or a node of your own.
 */
export function createArtwork(
  file: File,
  type: ResolvedFileType,
  attributes: Record<string, string>
): Artwork {
  const element = createElement('span', attributes);
  let url: string | null = null;

  if (
    type.artwork === 'thumbnail' &&
    typeof URL.createObjectURL === 'function'
  ) {
    url = URL.createObjectURL(file);
    const image = createElement('img', {
      class: 'thumbnail',
      alt: '',
      src: url,
      draggable: 'false',
      decoding: 'async',
    });
    image.addEventListener(
      'error',
      () => {
        element.dataset.artwork = 'lines';
        image.replaceWith(...lines());
      },
      { once: true }
    );
    element.dataset.artwork = 'thumbnail';
    element.append(image);
  } else if (typeof type.artwork === 'function') {
    element.dataset.artwork = 'custom';
    element.append(type.artwork(file));
  } else {
    element.dataset.artwork = 'lines';
    element.append(...lines());
  }

  return {
    element,
    dispose() {
      if (url) URL.revokeObjectURL(url);
      url = null;
    },
  };
}

export interface CardView {
  readonly element: HTMLButtonElement;
  readonly file: File;
  readonly type: ResolvedFileType;

  /**
   * Size before scaling, in pixels.
   */
  size(): { width: number; height: number };

  /**
   * Takes the card out of the CSS layout and draws it at `pose`.
   */
  place(pose: Pose): void;

  /**
   * Hands the card back to the CSS layout (its spot on the court).
   */
  release(): void;

  dispose(): void;
}

export function createCard(
  file: File,
  type: ResolvedFileType,
  label: string
): CardView {
  const artwork = createArtwork(file, type, {
    class: 'card-artwork',
    part: 'file-artwork',
  });
  const element = createElement(
    'button',
    {
      type: 'button',
      class: 'card',
      part: `file file-${type.kind}`,
      'data-kind': type.kind,
      'aria-label': label,
    },
    [
      createElement('span', { class: 'card-paper' }, [
        artwork.element,
        createElement('span', { class: 'card-badge', part: 'file-badge' }, [
          type.label,
        ]),
      ]),
    ]
  );
  element.style.setProperty('--_file-color', fileColor(type));

  const size = (): { width: number; height: number } => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  });

  return {
    element,
    file,
    type,
    size,
    place(pose) {
      const { width, height } = size();
      const style = poseStyle(pose, width, height);
      element.style.translate = style.translate;
      element.style.rotate = style.rotate;
      element.style.scale = style.scale;
    },
    release() {
      element.style.removeProperty('translate');
      element.style.removeProperty('rotate');
      element.style.removeProperty('scale');
      element.style.removeProperty('opacity');
    },
    dispose() {
      artwork.dispose();
      element.remove();
    },
  };
}
