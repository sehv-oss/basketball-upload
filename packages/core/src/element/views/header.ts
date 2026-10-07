import { createElement, setFallback } from '../dom.ts';
import type { Messages } from '../messages.ts';
import { play } from '../motion.ts';

export interface HeaderView {
  readonly element: HTMLElement;
  update(messages: Messages): void;

  /**
   * Shows the number of files in the basket; `bump` animates an increase.
   */
  setCount(count: number, bump: boolean): void;
}

export function createHeader(): HeaderView {
  const title = createElement('slot', { name: 'title' });
  const description = createElement('slot', { name: 'description' });
  const counterLabel = createElement('span', {
    class: 'counter-label',
    part: 'counter-label',
  });
  const counterValue = createElement(
    'span',
    { class: 'counter-value', part: 'counter-value' },
    ['0']
  );

  const element = createElement('header', { class: 'header', part: 'header' }, [
    createElement('div', { class: 'heading' }, [
      createElement('h2', { class: 'title', part: 'title' }, [title]),
      createElement('p', { class: 'description', part: 'description' }, [
        description,
      ]),
    ]),
    createElement('p', { class: 'counter', part: 'counter' }, [
      counterLabel,
      counterValue,
    ]),
  ]);

  let count = 0;

  return {
    element,
    update(messages) {
      setFallback(title, messages.title);
      setFallback(description, messages.description);
      counterLabel.textContent = messages.counter;
    },
    setCount(value, bump) {
      if (value === count) return;
      const increased = value > count;
      count = value;
      counterValue.textContent = String(value);
      if (bump && increased) {
        void play(
          counterValue,
          [{ scale: '1' }, { scale: '1.35' }, { scale: '1' }],
          { duration: 360, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
        );
      }
    },
  };
}
