import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  BasketballUploadElement,
  defaultMessages,
  registerBasketballUpload,
  registerFileType,
  type Messages,
  type Theme,
  type UploadItem,
} from '../../src/basketball-upload.ts';
import {
  center,
  fileDrag,
  keyboard,
  mount,
  nextEvent,
  pdf,
  png,
  pointer,
  query,
  shadow,
  stillResolves,
  wait,
} from './helpers.ts';

type ItemsEvent = CustomEvent<{ items: readonly UploadItem[] }>;
type ShotEvent = CustomEvent<{ file: File; result: 'score' | 'miss' }>;

beforeAll(() => {
  registerBasketballUpload();
});

afterEach(() => {
  document.body.replaceChildren();
});

const basketHas = (count: number) => (event: ItemsEvent) =>
  event.detail.items.length === count;

describe('registration', () => {
  it('is idempotent, and supports other tag names', () => {
    expect(() => registerBasketballUpload()).not.toThrow();
    registerBasketballUpload({ tagName: 'my-hoop' });

    const custom = document.createElement('my-hoop');
    expect(custom).toBeInstanceOf(BasketballUploadElement);
    expect(customElements.get('basketball-upload')).toBe(
      BasketballUploadElement
    );
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
    title.textContent = 'Send your files';
    element.append(title);
    expect(
      query<HTMLSlotElement>(element, 'slot[name="title"]').assignedElements()
    ).toEqual([title]);
  });

  it('applies new messages', () => {
    const element = mount();
    element.messages = { counter: 'Sent', prompt: 'Drop it here' };

    expect(query(element, '.counter-label').textContent).toBe('Sent');
    expect(query(element, 'slot[name="prompt"]').textContent).toBe(
      'Drop it here'
    );
    expect(query(element, 'slot[name="title"]').textContent).toBe(
      'Upload files'
    );
  });
});

describe('theming', () => {
  async function accentShades(
    element: BasketballUploadElement
  ): Promise<{ strong: string; surface: string }> {
    const dropzone = query(element, '.dropzone');
    element.dispatchEvent(fileDrag('dragover', [pdf()], center(dropzone)));
    await wait(250);

    return {
      strong: getComputedStyle(query(element, '.rim-bracket')).fill,
      surface: getComputedStyle(dropzone).backgroundColor,
    };
  }

  function color(value: string): string {
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.append(probe);
    return getComputedStyle(probe).color;
  }

  it('shades the accent of the reference with its own colors', async () => {
    const light = mount({ theme: 'light' });
    expect(await accentShades(light)).toEqual({
      strong: 'rgb(189, 77, 25)',
      surface: 'rgb(255, 244, 239)',
    });

    const dark = mount({ theme: 'dark' });
    expect(await accentShades(dark)).toEqual({
      strong: 'rgb(196, 82, 31)',
      surface: color('color-mix(in oklab, #f26a39 14%, #181b21)'),
    });
  });

  it('derives the shades of a custom accent', async () => {
    const element = mount({ theme: 'light' });
    element.style.setProperty('--basketball-upload-accent', 'rgb(8, 145, 178)');

    expect(await accentShades(element)).toEqual({
      strong: color('color-mix(in oklab, rgb(8, 145, 178) 84%, black)'),
      surface: color('color-mix(in oklab, rgb(8, 145, 178) 8%, white)'),
    });
  });

  it('keeps the shades set with their own tokens', async () => {
    const element = mount({ theme: 'light' });
    element.style.setProperty('--basketball-upload-accent', 'rgb(8, 145, 178)');
    element.style.setProperty(
      '--basketball-upload-accent-strong',
      'rgb(1, 2, 3)'
    );
    element.style.setProperty(
      '--basketball-upload-accent-surface',
      'rgb(4, 5, 6)'
    );

    expect(await accentShades(element)).toEqual({
      strong: 'rgb(1, 2, 3)',
      surface: 'rgb(4, 5, 6)',
    });
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

  it('ignore sizes and counts that are not numbers of zero or more', () => {
    const element = mount();
    for (const value of ['abc', '-1', '', '  ', 'Infinity']) {
      element.setAttribute('max-size', value);
      element.setAttribute('max-files', value);
      element.setAttribute('concurrency', value);

      expect(element.maxSize, value).toBeNull();
      expect(element.maxFiles, value).toBeNull();
      expect(element.concurrency, value).toBe(3);
    }

    element.setAttribute('concurrency', '0');
    expect(element.concurrency).toBe(3);
    element.setAttribute('concurrency', '2.7');
    expect(element.concurrency).toBe(2);
  });

  it('fall back to the system theme for unknown themes', () => {
    const element = mount({ theme: 'neon' });
    expect(element.theme).toBe('system');

    element.theme = 'dark';
    element.theme = 'neon' as Theme;
    expect(element.hasAttribute('theme')).toBe(false);
  });

  it('remove the attribute for empty values', () => {
    const element = mount({
      accept: '.pdf',
      name: 'files',
      'max-files': '2',
      concurrency: '1',
      required: '',
      disabled: '',
      instant: '',
    });

    element.accept = '';
    element.name = null;
    element.maxFiles = null;
    element.concurrency = undefined;
    element.required = false;
    element.disabled = null;
    element.instant = undefined;

    expect(element.getAttributeNames()).toEqual(['style']);
    expect(element.accept).toBe('');
    expect(element.name).toBe('');
    expect(element.concurrency).toBe(3);
  });

  it('take null messages and file types as the defaults', () => {
    const element = mount();
    element.messages = { title: 'Send your files' };
    element.fileTypes = [{ kind: 'figma', match: '.fig' }];

    element.messages = null;
    element.fileTypes = null;

    expect(element.messages).toEqual(defaultMessages);
    expect(element.fileTypes).toEqual([]);
  });

  it('keep the default of messages set to undefined', () => {
    const element = mount();
    element.messages = {
      title: undefined,
      shoot: undefined,
    } as unknown as Partial<Messages>;
    element.stage([pdf()]);

    expect(query(element, 'slot[name="title"]').textContent).toBe(
      'Upload files'
    );
    expect(query(element, '.card').getAttribute('aria-label')).toBe(
      'Shoot final_final_v7.pdf'
    );
  });

  it('keep the previous file types when new ones are invalid', () => {
    const element = mount();
    const types = [{ kind: 'figma', match: '.fig' }];
    element.fileTypes = types;

    expect(() => {
      element.fileTypes = [
        { kind: 'sketch', match: '.sketch' },
        { kind: 'Bad Kind', match: '.bad' },
      ];
    }).toThrow(TypeError);
    expect(element.fileTypes).toBe(types);
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

  it('announces a rejection, and flags it for a moment', async () => {
    const element = mount({ accept: '.pdf' });
    element.stage([new File(['x'], 'photo.png', { type: 'image/png' })]);

    expect(element.matches(':state(rejected)')).toBe(true);
    const live = query(element, '[role="status"]');
    await vi.waitFor(() =>
      expect(live.textContent).toBe('photo.png is not an accepted file type.')
    );
    await vi.waitFor(() =>
      expect(element.matches(':state(rejected)')).toBe(false)
    );
  });

  it('takes one file without multiple, keeping it when the next is rejected', async () => {
    const element = mount({ accept: '.pdf', 'max-files': '5' });
    const rejected: string[] = [];
    element.addEventListener('file-reject', (event) =>
      rejected.push(`${event.detail.file.name}: ${event.detail.reason}`)
    );

    element.stage([pdf('first.pdf'), pdf('second.pdf')]);
    element.stage([new File(['x'], 'photo.png', { type: 'image/png' })]);

    expect(rejected).toEqual(['second.pdf: count', 'photo.png: type']);
    const cards = shadow(element).querySelectorAll('.card');
    expect(cards).toHaveLength(1);
    expect(cards[0]?.getAttribute('aria-label')).toBe('Shoot first.pdf');
    await vi.waitFor(() =>
      expect(query(element, '[role="status"]').textContent).toBe(
        'photo.png is not an accepted file type.'
      )
    );
  });

  it('rejects every file with max-files="0"', () => {
    const element = mount({ multiple: '', 'max-files': '0' });
    const reasons: string[] = [];
    element.addEventListener('file-reject', (event) =>
      reasons.push(event.detail.reason)
    );
    element.stage([pdf(), pdf('second.pdf')]);

    expect(reasons).toEqual(['count', 'count']);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
  });

  it('ignores a max-size that is not a number', () => {
    const element = mount({ 'max-size': 'big' });
    element.stage([pdf('huge.pdf', 10_000)]);

    expect(shadow(element).querySelectorAll('.card')).toHaveLength(1);
  });

  it('counts the files in the basket towards max-files, once', async () => {
    const element = mount({ multiple: '', 'max-files': '2' });
    const rejected: string[] = [];
    element.addEventListener('file-reject', (event) =>
      rejected.push(event.detail.file.name)
    );
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dunk([pdf('first.pdf')]);
    await change;

    element.stage([pdf('second.pdf'), pdf('third.pdf')]);

    expect(rejected).toEqual(['third.pdf']);
  });

  it('does nothing with an empty list of files', () => {
    const element = mount({ multiple: '' });
    const reject = vi.fn();
    element.addEventListener('file-reject', reject);
    element.stage([]);
    element.dunk([]);

    expect(reject).not.toHaveBeenCalled();
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
  });

  it('renames the staged cards when the messages change', () => {
    const element = mount({ multiple: '' });
    element.stage([pdf()]);
    element.messages = { shoot: (name) => `Throw ${name}` };

    expect(query(element, '.card').getAttribute('aria-label')).toBe(
      'Throw final_final_v7.pdf'
    );
  });
});

describe('the file picker', () => {
  it('opens with the accept and multiple of the element', () => {
    const element = mount({ accept: '.pdf', multiple: '' });
    const input = query<HTMLInputElement>(element, 'input[type="file"]');
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    query(element, '.dropzone').click();

    expect(click).toHaveBeenCalledOnce();
    expect(input.accept).toBe('.pdf');
    expect(input.multiple).toBe(true);
  });

  it('stays closed while disabled', () => {
    const element = mount({ disabled: '' });
    const input = query<HTMLInputElement>(element, 'input[type="file"]');
    const click = vi.spyOn(input, 'click').mockImplementation(() => {});

    element.openPicker();

    expect(click).not.toHaveBeenCalled();
  });

  it('stages the picked files, and forgets them for the next pick', () => {
    const element = mount({ multiple: '' });
    const input = query<HTMLInputElement>(element, 'input[type="file"]');
    const picked = new DataTransfer();
    picked.items.add(pdf());
    input.files = picked.files;

    input.dispatchEvent(new Event('change'));

    expect(shadow(element).querySelectorAll('.card')).toHaveLength(1);
    expect(input.files).toHaveLength(0);
  });

  it('dunks the picked files with instant', async () => {
    const element = mount({ multiple: '', instant: '' });
    const input = query<HTMLInputElement>(element, 'input[type="file"]');
    const picked = new DataTransfer();
    picked.items.add(pdf());
    input.files = picked.files;
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));

    input.dispatchEvent(new Event('change'));

    await change;
  });
});

describe('dragging', () => {
  function textDrag(
    type: 'dragover' | 'drop',
    point: { x: number; y: number }
  ): DragEvent {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', 'not a file');
    return new DragEvent(type, {
      dataTransfer,
      clientX: point.x,
      clientY: point.y,
      bubbles: true,
      composed: true,
      cancelable: true,
    });
  }

  it('ignores drags without files', () => {
    const element = mount({ multiple: '' });
    const point = center(query(element, '.dropzone'));
    const over = textDrag('dragover', point);
    const drop = textDrag('drop', point);

    element.dispatchEvent(over);
    expect(over.defaultPrevented).toBe(false);
    expect(element.matches(':state(dragging)')).toBe(false);

    element.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(false);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
  });

  it('refuses drops while disabled, without rejecting the files', async () => {
    const element = mount({ multiple: '', disabled: '' });
    const reject = vi.fn();
    element.addEventListener('file-reject', reject);
    const point = center(query(element, '.dropzone'));
    const over = fileDrag('dragover', [pdf()], point);

    element.dispatchEvent(over);
    expect(over.dataTransfer?.dropEffect).toBe('none');
    expect(element.matches(':state(dragging)')).toBe(false);

    element.dispatchEvent(fileDrag('drop', [pdf()], point));
    await wait(50);
    expect(element.items).toHaveLength(0);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
    expect(reject).not.toHaveBeenCalled();
  });

  it('stops only when the drag leaves the element', () => {
    const element = mount({ multiple: '' });
    const dropzone = query(element, '.dropzone');
    element.dispatchEvent(fileDrag('dragover', [pdf()], center(dropzone)));

    const leave = (point: { x: number; y: number }): void => {
      element.dispatchEvent(
        new DragEvent('dragleave', {
          clientX: point.x,
          clientY: point.y,
          bubbles: true,
          composed: true,
        })
      );
    };

    leave(center(element));
    expect(element.matches(':state(dragging)')).toBe(true);

    leave({ x: 2000, y: 2000 });
    expect(element.matches(':state(dragging)')).toBe(false);
    expect(element.matches(':state(drop-target)')).toBe(false);
  });

  it('dunks files dropped on the court with instant', async () => {
    const element = mount({ multiple: '', instant: '' });
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dispatchEvent(fileDrag('drop', [pdf()], { x: 120, y: 760 }));

    await change;
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
    card.dispatchEvent(keyboard('keydown', 'Enter'));
    card.dispatchEvent(keyboard('keyup', 'Enter'));

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

  it('announces failed uploads', async () => {
    const element = mount();
    element.uploader = () => Promise.reject(new Error('offline'));
    const failure = nextEvent(element, 'upload-error');
    element.dunk([pdf()]);
    await failure;

    await vi.waitFor(() =>
      expect(query(element, '[role="status"]').textContent).toBe(
        'final_final_v7.pdf failed to upload.'
      )
    );
    expect(query(element, '.item-status').textContent).toBe('Upload failed');
  });

  it('takes a file out of the basket, its row and the form', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const element = mount({ name: 'files', multiple: '' }, form);
    const filled = nextEvent<ItemsEvent>(element, 'change', basketHas(2));
    element.dunk([pdf('first.pdf'), pdf('second.pdf')]);
    await filled;

    const removed = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    expect(element.removeItem(element.items[0]!.id)).toBe(true);
    await removed;

    expect(query(element, '.counter-value').textContent).toBe('1');
    expect(shadow(element).querySelectorAll('.item')).toHaveLength(1);
    const files = new FormData(form).getAll('files') as File[];
    expect(files.map((file) => file.name)).toEqual(['second.pdf']);
  });

  it('returns false for unknown items, and when nothing is staged', () => {
    const element = mount();

    expect(element.retryItem('missing')).toBe(false);
    expect(element.removeItem('missing')).toBe(false);
    expect(element.shoot()).toBe(false);
  });
});

describe('clearing', () => {
  it('removes the cards fading out of the net', async () => {
    const element = mount({ multiple: '' });
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dunk([pdf()]);
    await change;

    element.clear();

    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
    expect(element.items).toHaveLength(0);
  });

  it('drops the dunks still on their way', async () => {
    const element = mount({ multiple: '' });
    element.dunk([pdf('first.pdf'), pdf('second.pdf')]);
    await wait(100);

    element.clear();
    await wait(1000);

    expect(element.items).toHaveLength(0);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);
    expect(element.matches(':state(scoring)')).toBe(false);
  });
});

describe('without a layout', () => {
  it('dunks straight into the basket, and cannot shoot', async () => {
    const element = mount({ multiple: '' });
    element.style.display = 'none';

    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dunk([pdf('dunked.pdf')]);
    await change;

    element.stage([pdf('staged.pdf')]);
    expect(element.shoot()).toBe(false);
    expect(element.items.map((item) => item.file.name)).toEqual(['dunked.pdf']);
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

  it('submits nothing without a name', async () => {
    const form = document.createElement('form');
    document.body.append(form);
    const element = mount({ multiple: '' }, form);
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.dunk([pdf()]);
    await change;

    expect([...new FormData(form).keys()]).toEqual([]);
  });

  it('validates without a form, with the message of its messages', () => {
    const element = mount({ required: '' });

    expect(element.form).toBeNull();
    expect(element.willValidate).toBe(true);
    expect(element.checkValidity()).toBe(false);
    expect(element.validationMessage).toBe('Add at least one file.');

    element.messages = { required: 'Pick a file first.' };
    expect(element.validationMessage).toBe('Pick a file first.');

    element.required = false;
    expect(element.checkValidity()).toBe(true);
    expect(element.reportValidity()).toBe(true);
  });

  it('is disabled with its fieldset', () => {
    const fieldset = document.createElement('fieldset');
    fieldset.disabled = true;
    document.body.append(fieldset);
    const element = mount({ multiple: '' }, fieldset);
    const dropzone = query<HTMLButtonElement>(element, '.dropzone');

    expect(element.matches(':state(disabled)')).toBe(true);
    expect(dropzone.disabled).toBe(true);
    element.stage([pdf()]);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(0);

    fieldset.disabled = false;
    expect(element.matches(':state(disabled)')).toBe(false);
    expect(dropzone.disabled).toBe(false);
    element.stage([pdf()]);
    expect(shadow(element).querySelectorAll('.card')).toHaveLength(1);
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
    element.style.setProperty('--basketball-upload-file-pdf', 'rgb(0, 128, 0)');
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

  it('keeps no thumbnail file alive once removed', async () => {
    const element = mount({ multiple: '' });
    const change = nextEvent<ItemsEvent>(element, 'change', basketHas(1));
    element.stage([await png('staged.png')]);
    element.dunk([await png('dunked.png')]);
    await change;
    const thumbnails = [
      query<HTMLImageElement>(element, '.card:not([inert]) .thumbnail'),
      query<HTMLImageElement>(element, '.item .thumbnail'),
    ];
    await vi.waitFor(() => {
      for (const thumbnail of thumbnails) {
        expect(thumbnail.naturalWidth).toBe(24);
      }
    });

    element.remove();

    for (const thumbnail of thumbnails) {
      expect(await stillResolves(thumbnail.src)).toBe(false);
    }
  });

  it('rejects kinds that cannot be part names', () => {
    const element = mount();
    expect(() => {
      element.fileTypes = [{ kind: 'Not Valid', match: '.x' }];
    }).toThrow(TypeError);
  });
});
