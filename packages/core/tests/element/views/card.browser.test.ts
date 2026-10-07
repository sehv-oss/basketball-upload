import { describe, expect, it } from 'vitest';

import { createArtwork } from '../../../src/element/views/card.ts';
import type { ResolvedFileType } from '../../../src/file-types/types.ts';
import { nextEvent, png, stillResolves } from '../helpers.ts';

const image: ResolvedFileType = {
  kind: 'image',
  label: 'PNG',
  color: null,
  artwork: 'thumbnail',
};

function thumbnailOf(artwork: { element: HTMLElement }): HTMLImageElement {
  const thumbnail = artwork.element.querySelector('img');
  if (!thumbnail) throw new Error('No thumbnail');

  return thumbnail;
}

describe('thumbnails', () => {
  it('let go of the file of an image that cannot be decoded', async () => {
    const broken = new File([new Uint8Array(10)], 'broken.png', {
      type: 'image/png',
    });
    const artwork = createArtwork(broken, image, {});
    const thumbnail = thumbnailOf(artwork);

    await nextEvent(thumbnail, 'error');

    expect(artwork.element.dataset.artwork).toBe('lines');
    expect(await stillResolves(thumbnail.src)).toBe(false);
  });

  it('let go of the file when disposed before the image loads', async () => {
    const artwork = createArtwork(await png(), image, {});
    const { src } = thumbnailOf(artwork);

    artwork.dispose();

    expect(await stillResolves(src)).toBe(false);
  });
});
