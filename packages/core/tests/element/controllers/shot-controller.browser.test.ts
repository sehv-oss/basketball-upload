import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import {
  registerBasketballUpload,
  type BasketballUploadElement,
} from '../../../src/basketball-upload.ts';
import {
  center,
  fileDrag,
  keyboard,
  mount,
  nextEvent,
  pdf,
  pointer,
  query,
  shadow,
  stubReducedMotion,
  wait,
} from '../helpers.ts';

type ShotEvent = CustomEvent<{ file: File; result: 'score' | 'miss' }>;

beforeAll(() => {
  registerBasketballUpload();
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

function visibleDots(element: BasketballUploadElement): number {
  return shadow(element).querySelectorAll('.dot:not([hidden])').length;
}

/**
 * Stages one card and starts pulling it, like the design: down and to the left.
 */
function aim(element: BasketballUploadElement): {
  card: HTMLElement;
  start: { x: number; y: number };
} {
  element.stage([pdf()]);
  const card = query(element, '.card');
  const start = center(card);
  card.dispatchEvent(pointer('pointerdown', start));
  card.dispatchEvent(pointer('pointermove', { x: 140, y: 775 }));

  return { card, start };
}

/**
 * Stages one card, focuses it and holds Enter on it.
 */
function hold(element: BasketballUploadElement): HTMLElement {
  element.stage([pdf()]);
  const card = query(element, '.card');
  card.focus();
  card.dispatchEvent(keyboard('keydown', 'Enter'));

  return card;
}

/**
 * Center of the aiming dot at `index`, in pixels.
 */
function dot(
  element: BasketballUploadElement,
  index: number
): { x: number; y: number } {
  const circle = shadow(element).querySelectorAll('.dot')[index];
  if (!circle) throw new Error(`No dot ${index}`);

  return {
    x: Number(circle.getAttribute('cx')),
    y: Number(circle.getAttribute('cy')),
  };
}

describe('aiming', () => {
  it('only grabs a card with the primary button', () => {
    const element = mount();
    element.stage([pdf()]);
    const card = query(element, '.card');

    card.dispatchEvent(pointer('pointerdown', center(card), { button: 2 }));

    expect(element.matches(':state(aiming)')).toBe(false);
  });

  it('follows only the pointer that grabbed the card', () => {
    const element = mount();
    element.stage([pdf()]);
    const card = query(element, '.card');
    card.dispatchEvent(pointer('pointerdown', center(card)));

    card.dispatchEvent(
      pointer('pointermove', { x: 140, y: 775 }, { pointerId: 8 })
    );
    card.dispatchEvent(
      pointer('pointerup', { x: 140, y: 775 }, { pointerId: 8 })
    );

    expect(visibleDots(element)).toBe(0);
    expect(element.matches(':state(aiming)')).toBe(true);
  });

  it('hides the dots when the pull gets too short again', () => {
    const element = mount();
    const { card, start } = aim(element);
    expect(visibleDots(element)).toBeGreaterThan(5);

    card.dispatchEvent(pointer('pointermove', { x: start.x + 2, y: start.y }));

    expect(visibleDots(element)).toBe(0);
  });

  it.each([
    [
      'Escape',
      (card: HTMLElement) =>
        card.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        ),
    ],
    [
      'a cancelled pointer',
      (card: HTMLElement) =>
        card.dispatchEvent(pointer('pointercancel', { x: 140, y: 775 })),
    ],
    [
      'a lost pointer capture',
      (card: HTMLElement) =>
        card.dispatchEvent(pointer('lostpointercapture', { x: 140, y: 775 })),
    ],
  ])('puts the card back without shooting on %s', async (_, cancel) => {
    const element = mount();
    const shot = vi.fn();
    element.addEventListener('shot', shot);
    const { card } = aim(element);

    cancel(card);

    expect(element.matches(':state(aiming)')).toBe(false);
    expect(visibleDots(element)).toBe(0);
    card.dispatchEvent(pointer('pointerup', { x: 140, y: 775 }));
    await wait(700);
    expect(element.matches(':state(flying)')).toBe(false);
    expect(shot).not.toHaveBeenCalled();
    expect(card.style.translate).toBe('');
  });

  it('stops when the element is disabled', () => {
    const element = mount();
    aim(element);

    element.disabled = true;

    expect(element.matches(':state(aiming)')).toBe(false);
    expect(visibleDots(element)).toBe(0);
  });
});

describe('shooting', () => {
  it('shoots one card at a time', () => {
    const element = mount({ multiple: '' });
    element.stage([pdf('first.pdf'), pdf('second.pdf')]);

    expect(element.shoot()).toBe(true);
    expect(element.shoot()).toBe(false);

    const next = query(element, '.card[data-depth="0"]');
    next.dispatchEvent(pointer('pointerdown', center(next)));
    expect(element.matches(':state(aiming)')).toBe(false);
  });

  it('cannot grab the card in the air', () => {
    const element = mount();
    element.stage([pdf()]);
    const card = query(element, '.card');
    element.shoot();

    card.dispatchEvent(pointer('pointerdown', center(card)));

    expect(element.matches(':state(aiming)')).toBe(false);
    expect(element.matches(':state(flying)')).toBe(true);
  });

  it('only shoots the top card, with Enter or Space', () => {
    const element = mount({ multiple: '' });
    element.stage([pdf('bottom.pdf'), pdf('top.pdf')]);
    const [bottom, top] = shadow(element).querySelectorAll('.card');

    bottom!.dispatchEvent(keyboard('keydown', 'Enter'));
    bottom!.dispatchEvent(keyboard('keyup', 'Enter'));
    top!.dispatchEvent(keyboard('keydown', 'a'));
    top!.dispatchEvent(keyboard('keyup', 'a'));
    expect(element.matches(':state(flying)')).toBe(false);

    top!.dispatchEvent(keyboard('keydown', ' '));
    top!.dispatchEvent(keyboard('keyup', ' '));
    expect(element.matches(':state(flying)')).toBe(true);
  });

  it('brings a missed card back to the court', async () => {
    const element = mount();
    element.stage([pdf()]);
    const card = query(element, '.card');
    const start = center(card);
    const shot = nextEvent<ShotEvent>(element, 'shot');

    card.dispatchEvent(pointer('pointerdown', start));
    card.dispatchEvent(pointer('pointermove', { x: start.x, y: start.y - 60 }));
    card.dispatchEvent(pointer('pointerup', { x: start.x, y: start.y - 60 }));

    expect((await shot).detail.result).toBe('miss');
    expect(element.items).toHaveLength(0);
    expect(card.inert).toBe(false);
    expect(card.dataset.depth).toBe('0');
    await vi.waitFor(() =>
      expect(query(element, '[role="status"]').textContent).toBe(
        'Missed final_final_v7.pdf. Take the shot again.'
      )
    );
  });

  it('puts a card in the air back on the court when the element leaves the page', async () => {
    const element = mount();
    const shot = vi.fn();
    element.addEventListener('shot', shot);
    element.stage([pdf()]);
    element.shoot();

    element.remove();
    document.body.append(element);

    expect(element.matches(':state(flying)')).toBe(false);
    const card = query(element, '.card');
    expect(card.inert).toBe(false);
    expect(card.style.translate).toBe('');
    await wait(600);
    expect(shot).not.toHaveBeenCalled();
    expect(element.items).toHaveLength(0);
  });
});

describe('aiming with the keyboard', () => {
  it.each(['Enter', ' '])(
    'aims while %j is held, and shoots on release',
    (key) => {
      const element = mount();
      element.stage([pdf()]);
      const card = query(element, '.card');

      card.dispatchEvent(keyboard('keydown', key));

      expect(element.matches(':state(aiming)')).toBe(true);
      expect(element.matches(':state(flying)')).toBe(false);
      expect(visibleDots(element)).toBeGreaterThan(5);

      card.dispatchEvent(keyboard('keyup', key));

      expect(element.matches(':state(aiming)')).toBe(false);
      expect(element.matches(':state(flying)')).toBe(true);
    }
  );

  it('turns the shot with the left and right arrows', () => {
    const element = mount();
    element.stage([pdf()]);
    const card = query(element, '.card');
    expect(card.dispatchEvent(keyboard('keydown', 'ArrowRight'))).toBe(true);
    card.dispatchEvent(keyboard('keydown', 'Enter'));
    const assisted = dot(element, 4).x;

    const scrolled = card.dispatchEvent(keyboard('keydown', 'ArrowRight'));
    const right = dot(element, 4).x;
    card.dispatchEvent(keyboard('keydown', 'ArrowLeft'));
    card.dispatchEvent(keyboard('keydown', 'ArrowLeft'));
    const left = dot(element, 4).x;

    expect(scrolled).toBe(false);
    expect(right).toBeGreaterThan(assisted);
    expect(left).toBeLessThan(assisted);
  });

  it('makes the shot stronger with the up arrow, and weaker with the down arrow', () => {
    const element = mount();
    const card = hold(element);
    const assisted = dot(element, 4).y;

    card.dispatchEvent(keyboard('keydown', 'ArrowUp'));
    const stronger = dot(element, 4).y;
    card.dispatchEvent(keyboard('keydown', 'ArrowDown'));
    card.dispatchEvent(keyboard('keydown', 'ArrowDown'));
    const weaker = dot(element, 4).y;

    expect(stronger).toBeLessThan(assisted);
    expect(weaker).toBeGreaterThan(assisted);
  });

  it('leans the card like the pointer would for the same pull', () => {
    const element = mount();
    const card = hold(element);

    for (let press = 0; press < 10; press += 1) {
      card.dispatchEvent(keyboard('keydown', 'ArrowLeft'));
    }
    const aimedLeft = parseFloat(card.style.rotate);
    for (let press = 0; press < 20; press += 1) {
      card.dispatchEvent(keyboard('keydown', 'ArrowRight'));
    }
    const aimedRight = parseFloat(card.style.rotate);

    expect(aimedRight).toBeLessThan(aimedLeft);
  });

  it('shoots where the arrows aimed', async () => {
    const element = mount();
    const card = hold(element);
    const shot = nextEvent<ShotEvent>(element, 'shot');

    for (let press = 0; press < 15; press += 1) {
      card.dispatchEvent(
        keyboard('keydown', 'ArrowLeft', { repeat: press > 0 })
      );
    }
    card.dispatchEvent(keyboard('keyup', 'Enter'));

    expect((await shot).detail.result).toBe('miss');
  });

  it.each([
    [
      'Escape',
      (card: HTMLElement) => card.dispatchEvent(keyboard('keydown', 'Escape')),
    ],
    ['the card losing focus', (card: HTMLElement) => card.blur()],
  ])('puts the card back without shooting on %s', async (_, cancel) => {
    const element = mount();
    const shot = vi.fn();
    element.addEventListener('shot', shot);
    const card = hold(element);

    cancel(card);

    expect(element.matches(':state(aiming)')).toBe(false);
    expect(visibleDots(element)).toBe(0);
    card.dispatchEvent(keyboard('keyup', 'Enter'));
    await wait(700);
    expect(element.matches(':state(flying)')).toBe(false);
    expect(shot).not.toHaveBeenCalled();
    expect(card.style.translate).toBe('');
  });

  it('does not aim again while the key is still held after Escape', async () => {
    const element = mount();
    const card = hold(element);
    card.dispatchEvent(keyboard('keydown', 'Escape'));
    await wait(700);

    card.dispatchEvent(keyboard('keydown', 'Enter', { repeat: true }));

    expect(element.matches(':state(aiming)')).toBe(false);
  });

  it.each(['Enter', 'Space'])(
    'does not open the file dialog when %s is held through the shot',
    async (key) => {
      const element = mount();
      element.stage([pdf()]);
      const picker = vi.fn((event: Event) => event.preventDefault());
      query(element, 'input[type="file"]').addEventListener('click', picker);
      query(element, '.card').focus();

      await userEvent.keyboard(`{${key}>4}`);
      await userEvent.keyboard(`{/${key}}`);

      expect(element.matches(':state(flying)')).toBe(true);
      expect(picker).not.toHaveBeenCalled();
    }
  );
});

describe('with reduced motion', () => {
  it('scores a shot at once, without a flight', () => {
    stubReducedMotion();
    const element = mount();
    const shot = vi.fn();
    element.addEventListener('shot', shot);
    element.stage([pdf()]);

    expect(element.shoot()).toBe(true);

    expect(element.matches(':state(flying)')).toBe(false);
    expect(shot).toHaveBeenCalledOnce();
    expect(element.items).toHaveLength(1);
  });

  it('does not fly dropped cards in', () => {
    stubReducedMotion();
    const element = mount({ multiple: '' });
    element.dispatchEvent(fileDrag('drop', [pdf()], { x: 120, y: 760 }));

    expect(query(element, '.card').getAnimations()).toHaveLength(0);
  });
});
