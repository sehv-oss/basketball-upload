import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  DndBasketballElement,
  registerDndBasketball,
  registerFileType,
  type UploadItem,
} from '../../src/dnd-basketball.ts';
import {
  center,
  fileDrag,
  mount,
  nextEvent,
  pdf,
  pointer,
  query,
  shadow,
} from './helpers.ts';

type ItemsEvent = CustomEvent<{ items: readonly UploadItem[] }>;
type ShotEvent = CustomEvent<{ file: File; result: 'score' | 'miss' }>;

beforeAll(() => {
  registerDndBasketball();
});

afterEach(() => {
  document.body.replaceChildren();
});

const basketHas = (count: number) => (event: ItemsEvent) =>
  event.detail.items.length === count;

describe('registration', () => {
  it('is idempotent, and supports other tag names', () => {
    expect(() => registerDndBasketball()).not.toThrow();
    registerDndBasketball({ tagName: 'my-hoop' });

    const custom = document.createElement('my-hoop');
    expect(custom).toBeInstanceOf(DndBasketballElement);
    expect(customElements.get('dnd-basketball')).toBe(DndBasketballElement);
  });
});

describe('rendering', () => {
  it('shows the copy of the design, with slots to replace it', () => {
    const element = mount();
    const text = shadow(element).textContent ?? '';
    expect(text).toContain('Upload files');
    expect(text).toContain('Drag and drop, or take the shot.');
    expect(text).toContain('Drop files here');
    expect(text).toContain('or take the shot');

    const title = document.createElement('span');
    title.slot = 'title';
    title.textContent = 'Enviar arquivos';
    element.append(title);
    expect(
      query<HTMLSlotElement>(element, 'slot[name="title"]').assignedElements()
    ).toEqual([title]);
  });

  it('applies new messages', () => {
    const element = mount();
    element.messages = { counter: 'Enviados', prompt: 'Solte aqui' };

    expect(query(element, '.counter-label').textContent).toBe('Enviados');
    expect(query(element, 'slot[name="prompt"]').textContent).toBe(
      'Solte aqui'
    );
    expect(query(element, 'slot[name="title"]').textContent).toBe(
      'Upload files'
    );
  });
});

describe('attributes and properties', () => {
  it('reflect each other', () => {
    const element = mount();
    element.multiple = true;
    element.maxSize = 1000;
    element.theme = 'dark';
    element.accept = '.pdf';

    expect(element.getAttribute('multiple')).toBe('');
    expect(element.getAttribute('max-size')).toBe('1000');
    expect(element.getAttribute('theme')).toBe('dark');
    expect(element.getAttribute('accept')).toBe('.pdf');

    element.setAttribute('max-files', '4');
    element.setAttribute('concurrency', '2');
    expect(element.maxFiles).toBe(4);
    expect(element.concurrency).toBe(2);

    element.theme = undefined;
    element.multiple = undefined;
    element.maxSize = undefined;
    expect(element.hasAttribute('theme')).toBe(false);
    expect(element.multiple).toBe(false);
    expect(element.maxSize).toBeNull();
  });
});

describe('the court', () => {
  it('stages files as cards of their type', () => {
    const element = mount({ multiple: '' });
    element.stage([pdf(), pdf('second.pdf')]);

    const cards = shadow(element).querySelectorAll('.card');
    expect(cards).toHaveLength(2);
    expect(cards[1]?.getAttribute('part')).toBe('file file-pdf');
    expect(cards[1]?.getAttribute('aria-label')).toBe('Shoot second.pdf');
    expect(cards[1]?.querySelector('[part="file-badge"]')?.textContent).toBe(
      'PDF'
    );
    // Only the card on top can be shot.
    expect((cards[0] as HTMLElement).inert).toBe(true);
    expect((cards[1] as HTMLElement).inert).toBe(false);
  });

  it('rejects files that do not match accept, max-size or max-files', async () => {
    const element = mount({
      multiple: '',
      accept: '.pdf',
      'max-size': '5000',
      'max-files': '1',
    });
    const reasons: string[] = [];
    element.addEventListener('file-reject', (event) =>
      reasons.push(event.detail.reason)
    );

    element.stage([
      new File(['x'], 'photo.png', { type: 'image/png' }),
      pdf('huge.pdf', 10_000),
      pdf('ok.pdf'),
      pdf('one-too-many.pdf'),
    ]);

    expect(reasons).toEqual(['type', 'size', 'count']);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(1);
  });

  it('replaces the previous file without multiple, like a file input', () => {
    const element = mount();
    element.stage([pdf('first.pdf')]);
    element.stage([pdf('second.pdf')]);

    const cards = shadow(element).querySelectorAll('.card');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.getAttribute('aria-label')).toBe('Shoot second.pdf');
  });

  it('ignores files while disabled', () => {
    const element = mount({ disabled: '' });
    element.stage([pdf()]);

    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
    expect(query<HTMLButtonElement>(element, '.dropzone').disabled).toBe(true);
  });
});

describe('scoring', () => {
  it('dunks files into the basket', async () => {
    const element = mount({ multiple: '' });
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dunk([pdf()]);

    const { detail } = await change;
    expect(detail.items[0]).toMatchObject({ status: 'ready', progress: 1 });
    expect(query(element, '.counter-value').textContent).toBe('1');
    expect(query(element, '.item-name').textContent).toBe('final_final_v7.pdf');
  });

  it('dunks files dropped on the dropzone', async () => {
    const element = mount({ multiple: '' });
    const dropzone = query(element, '.dropzone');
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));

    element.dispatchEvent(fileDrag('dragover', [pdf()], center(dropzone)));
    expect(element.matches(':state(drop-target)')).toBe(true);
    element.dispatchEvent(fileDrag('drop', [pdf()], center(dropzone)));

    await change;
    expect(element.matches(':state(dragging)')).toBe(false);
  });

  it('stages files dropped on the court', () => {
    const element = mount({ multiple: '' });
    element.dispatchEvent(fileDrag('drop', [pdf()], { x: 120, y: 760 }));

    expect(shadow(element).querySelectorAll('.card')).toHaveLength(1);
    expect(element.items).toHaveLength(0);
  });

  it('scores a slingshot shot pulled like in the design', async () => {
    const element = mount({ multiple: '' });
    element.stage([pdf()]);
    const card = query(element, '.card');
    const shot = nextEvent<ShotEvent>(element, 'shot');

    const start = center(card);
    card.dispatchEvent(pointer('pointerdown', start));
    expect(element.matches(':state(aiming)')).toBe(true);
    card.dispatchEvent(pointer('pointermove', { x: 140, y: 775 }));
    expect(
      shadow(element).querySelectorAll('.dot:not([hidden])').length
    ).toBeGreaterThan(5);
    card.dispatchEvent(pointer('pointerup', { x: 140, y: 775 }));

    expect((await shot).detail.result).toBe('score');
    expect(element.items).toHaveLength(1);
  });

  it('cancels a pull that is too short', async () => {
    const element = mount({ multiple: '' });
    element.stage([pdf()]);
    const card = query(element, '.card');
    const start = center(card);

    card.dispatchEvent(pointer('pointerdown', start));
    card.dispatchEvent(
      pointer('pointermove', { x: start.x + 4, y: start.y + 4 })
    );
    card.dispatchEvent(
      pointer('pointerup', { x: start.x + 4, y: start.y + 4 })
    );
    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(element.matches(':state(flying)')).toBe(false);
    expect(element.items).toHaveLength(0);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(1);
  });

  it('shoots from the keyboard with an assisted shot', async () => {
    const element = mount({ multiple: '' });
    element.stage([pdf()]);
    const card = query<HTMLButtonElement>(element, '.card');
    const shot = nextEvent<ShotEvent>(element, 'shot');

    card.focus();
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );

    expect((await shot).detail.result).toBe('score');
  });
});

describe('uploads', () => {
  it('uploads scored files, reporting progress and success', async () => {
    const element = mount({ multiple: '' });
    element.uploader = async (_file, { onProgress }) => {
      onProgress(50, 100);
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'stored';
    };
    const progress = nextEvent(element, 'upload-progress');
    const success = nextEvent<CustomEvent<{ item: UploadItem }>>(
      element,
      'upload-success'
    );
    element.dunk([pdf()]);

    await progress;
    const { detail } = await success;
    expect(detail.item).toMatchObject({
      status: 'uploaded',
      response: 'stored',
    });
    expect(query(element, '.item').dataset.status).toBe('uploaded');
    expect(query(element, '.item-status').textContent).toBe('Uploaded');
  });

  it('offers a retry when an upload fails', async () => {
    const element = mount({ multiple: '' });
    let attempts = 0;
    element.uploader = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('offline');
      return 'ok';
    };
    const failure = nextEvent<CustomEvent<{ item: UploadItem }>>(
      element,
      'upload-error'
    );
    element.dunk([pdf()]);
    await failure;

    const retry = query<HTMLButtonElement>(element, '.item-retry');
    expect(retry.hidden).toBe(false);
    const success = nextEvent(element, 'upload-success');
    retry.click();
    await success;
    expect(attempts).toBe(2);
  });
});

describe('forms', () => {
  it('submits the files in the basket under its name', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const element = mount({ name: 'files', multiple: '' }, form);
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dunk([pdf()]);
    await change;

    const files = new FormData(form).getAll('files') as File[];
    expect(files.map((file) => file.name)).toEqual(['final_final_v7.pdf']);
  });

  it('is invalid while required and empty', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const element = mount({ name: 'files', required: '' }, form);

    expect(form.checkValidity()).toBe(false);
    expect(element.validity?.valueMissing).toBe(true);

    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dunk([pdf()]);
    await change;
    expect(form.checkValidity()).toBe(true);
  });

  it('empties when its form resets', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const element = mount({ multiple: '' }, form);
    element.stage([pdf()]);
    form.reset();

    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
  });
});

describe('file types', () => {
  it('uses the types of the element first', () => {
    const element = mount();
    element.fileTypes = [
      { kind: 'figma', match: '.fig', label: 'FIG', color: 'rgb(1, 2, 3)' },
    ];
    element.stage([new File(['x'], 'board.fig')]);

    const card = query(element, '.card');
    expect(card.getAttribute('part')).toBe('file file-figma');
    const badge = query(element, '.card-badge');
    expect(badge.textContent).toBe('FIG');
    expect(getComputedStyle(badge).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('applies registered types to every element', () => {
    const unregister = registerFileType({
      kind: 'invoice',
      match: (file) => file.name.startsWith('invoice'),
      artwork: () =>
        Object.assign(document.createElement('b'), { textContent: '$' }),
    });
    try {
      const element = mount();
      element.stage([pdf('invoice-march.pdf')]);
      expect(query(element, '.card').dataset.kind).toBe('invoice');
      expect(query(element, '.card-artwork').textContent).toBe('$');
    } finally {
      unregister();
    }
  });

  it('lets a token recolor a built-in type', () => {
    const element = mount();
    element.style.setProperty('--dnd-basketball-file-pdf', 'rgb(0, 128, 0)');
    element.stage([pdf()]);

    expect(
      getComputedStyle(query(element, '.card-badge')).backgroundColor
    ).toBe('rgb(0, 128, 0)');
  });

  it('shows images as thumbnails', () => {
    const element = mount();
    element.stage([
      new File([new Uint8Array(10)], 'photo.png', { type: 'image/png' }),
    ]);

    expect(query<HTMLImageElement>(element, '.card .thumbnail').src).toMatch(
      /^blob:/
    );
  });

  it('rejects kinds that cannot be part names', () => {
    const element = mount();
    expect(() => {
      element.fileTypes = [{ kind: 'Not Valid', match: '.x' }];
    }).toThrow(TypeError);
  });
});
