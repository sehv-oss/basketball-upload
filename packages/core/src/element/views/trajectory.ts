import type { PreviewDot } from '../../game/simulate.ts';
import { svg } from '../dom.ts';

/** Dot radius, in rim units: 3.6 px on the 164 px rim of the design. */
const DOT_RADIUS = 0.022;

export interface TrajectoryView {
  readonly element: SVGSVGElement;
  /** Draws the dots of a preview. `unit` is the rim width in pixels. */
  show(dots: readonly PreviewDot[], unit: number): void;
  /** Hides the dots the card has already passed. */
  hideBefore(steps: number): void;
  clear(): void;
}

export function createTrajectory(): TrajectoryView {
  const element = svg('svg', {
    class: 'trajectory',
    part: 'trajectory',
    'aria-hidden': 'true',
  });
  const circles: SVGCircleElement[] = [];
  let shown: readonly PreviewDot[] = [];

  return {
    element,
    show(dots, unit) {
      shown = dots;
      while (circles.length < dots.length) {
        const circle = svg('circle', { class: 'dot' });
        circles.push(circle);
        element.append(circle);
      }
      const radius = Math.max(1.5, unit * DOT_RADIUS).toFixed(2);
      circles.forEach((circle, index) => {
        const dot = dots[index];
        circle.toggleAttribute('hidden', !dot);
        if (!dot) return;
        circle.setAttribute('cx', dot.x.toFixed(1));
        circle.setAttribute('cy', dot.y.toFixed(1));
        circle.setAttribute('r', radius);
      });
    },
    hideBefore(steps) {
      shown.forEach((dot, index) => {
        if (dot.steps <= steps) circles[index]?.setAttribute('hidden', '');
      });
    },
    clear() {
      shown = [];
      for (const circle of circles) circle.setAttribute('hidden', '');
    },
  };
}
