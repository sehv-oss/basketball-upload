import { createElement, createSvgElement, icon, setFallback } from '../dom.ts';
import type { Messages } from '../messages.ts';
import { play } from '../motion.ts';

/**
 * The hoop, drawn in layers so a card can pass between them: the dropzone is
 * the backboard, then the back of the rim, then (in the card layer above
 * this element) the cards, then the front of the rim and the net.
 */
export interface HoopView {
  readonly element: HTMLElement;

  readonly dropzone: HTMLButtonElement;

  readonly square: HTMLElement;

  /**
   * The front of the rim: its box is the rim the physics measures.
   */
  readonly rim: SVGSVGElement;

  readonly net: SVGSVGElement;

  update(messages: Messages): void;

  /**
   * The net swings as a card goes through.
   */
  swish(): void;

  /**
   * The "+1" over the square.
   */
  celebrate(reducedMotion: boolean): void;
}

/**
 * Net in a 164×104 box: the rim width on top, narrowing towards the bottom.
 */
function netLines(): SVGElement[] {
  const top = [3, 29.3, 55.7, 82, 108.3, 134.7, 161];
  const bottom = [31, 48, 65, 82, 99, 116, 133];
  const [topY, bottomY] = [2, 102];
  const lines: SVGElement[] = [];

  const line = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): void => {
    lines.push(
      createSvgElement('line', { x1: fromX, y1: fromY, x2: toX, y2: toY })
    );
  };

  for (let index = 0; index < top.length; index += 1) {
    const x = top[index] ?? 0;
    const left = bottom[index - 1];
    const right = bottom[index + 1];
    if (left !== undefined) line(x, topY, left, bottomY);
    if (right !== undefined) line(x, topY, right, bottomY);
  }
  line(top[0] ?? 0, topY, bottom[0] ?? 0, bottomY);
  line(top[top.length - 1] ?? 0, topY, bottom[bottom.length - 1] ?? 0, bottomY);

  for (const y of [42, 70]) {
    const progress = (y - topY) / (bottomY - topY);
    const inset = (31 - 3) * progress;
    line(3 + inset, y, 161 - inset, y);
  }
  return lines;
}

export function createHoop(): HoopView {
  const prompt = createElement('slot', { name: 'prompt' });
  const hint = createElement('slot', { name: 'hint' });

  const outline = createSvgElement(
    'svg',
    { class: 'dropzone-outline', 'aria-hidden': 'true' },
    [
      createSvgElement('rect', {
        x: 0,
        y: 0,
        width: '100%',
        height: '100%',
        rx: '4.5%',
        ry: '6.7%',
      }),
    ]
  );

  const dropzone = createElement(
    'button',
    { type: 'button', class: 'dropzone', part: 'dropzone' },
    [
      outline,
      icon('upload', { class: 'icon dropzone-icon', part: 'dropzone-icon' }),
      createElement('span', { class: 'prompt', part: 'prompt' }, [prompt]),
      createElement('span', { class: 'hint', part: 'hint' }, [hint]),
    ]
  );

  const square = createElement('div', {
    class: 'square',
    part: 'backboard-square',
  });

  const rimBack = createSvgElement(
    'svg',
    {
      class: 'rim rim-back',
      part: 'rim',
      viewBox: '0 0 164 18',
      'aria-hidden': 'true',
    },
    [
      createSvgElement('path', {
        class: 'rim-arc',
        d: 'M3 10 A79 6.5 0 0 1 161 10',
      }),
      createSvgElement('rect', {
        class: 'rim-bracket',
        x: 70,
        y: 0.5,
        width: 24,
        height: 10,
        rx: 1.5,
      }),
    ]
  );
  const rim = createSvgElement(
    'svg',
    {
      class: 'rim rim-front',
      part: 'rim',
      viewBox: '0 0 164 18',
      'aria-hidden': 'true',
    },
    [
      createSvgElement('path', {
        class: 'rim-arc',
        d: 'M3 10 A79 6.5 0 0 0 161 10',
      }),
    ]
  );

  const net = createSvgElement(
    'svg',
    {
      class: 'net',
      part: 'net',
      viewBox: '0 0 164 104',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    },
    netLines()
  );

  const scorePop = createElement(
    'span',
    { class: 'score-pop', part: 'score-pop', 'aria-hidden': 'true' },
    ['+1']
  );

  const element = createElement('div', { class: 'hoop', part: 'hoop' }, [
    dropzone,
    square,
    rimBack,
    rim,
    net,
    scorePop,
  ]);

  return {
    element,
    dropzone,
    square,
    rim,
    net,
    update(messages) {
      setFallback(prompt, messages.prompt);
      setFallback(hint, messages.hint);
      dropzone.setAttribute('aria-label', messages.dropzone);
    },
    celebrate(reducedMotion) {
      void play(
        scorePop,
        reducedMotion
          ? [
              { opacity: 0 },
              { opacity: 1, offset: 0.2 },
              { opacity: 1, offset: 0.7 },
              { opacity: 0 },
            ]
          : [
              { opacity: 0, translate: '0 0.3em', scale: '0.6' },
              { opacity: 1, translate: '0 0', scale: '1.1', offset: 0.12 },
              { opacity: 1, translate: '0 -0.1em', scale: '1', offset: 0.75 },
              { opacity: 0, translate: '0 -0.45em', scale: '1' },
            ],
        { duration: 1700, easing: 'ease-out' }
      );
    },
    swish() {
      void play(
        net,
        [
          { scale: '1 1' },
          { scale: '0.94 1.22', offset: 0.45 },
          { scale: '1.02 0.96', offset: 0.78 },
          { scale: '1 1' },
        ],
        { duration: 700, easing: 'ease-out' }
      );
    },
  };
}
