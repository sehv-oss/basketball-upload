import { describe, expect, it } from 'vitest';

import { PHYSICS } from '../../src/game/config.ts';
import { courtFromRectangles, rimCenter } from '../../src/game/court.ts';
import {
  launch,
  previewPath,
  step,
  type Body,
  type ShotEvent,
} from '../../src/game/simulate.ts';
import { solveAssistedShot } from '../../src/game/slingshot.ts';
import { designCourt as court } from './court.fixture.ts';

function run(
  start: Body,
  until: readonly ShotEvent[] = ['score', 'floor']
): { event: ShotEvent | null; body: Body } {
  let body = start;
  const limit = Math.round(PHYSICS.maxFlightTime / PHYSICS.step);
  while (body.steps < limit) {
    const result = step(body, court);
    body = result.body;
    const event = result.events.find((candidate) => until.includes(candidate));
    if (event) return { event, body };
  }

  return { event: null, body };
}

describe('courtFromRectangles', () => {
  it('measures the rim plane and the rest spot relative to the host', () => {
    const measured = courtFromRectangles({
      host: { x: 100, y: 50, width: 754, height: 887 },
      board: { x: 277, y: 225, width: 400, height: 268 },
      square: { x: 409, y: 398, width: 136, height: 80 },
      rim: { x: 395, y: 486, width: 164, height: 14 },
      net: { x: 395, y: 497, width: 164, height: 100 },
      spot: { x: 240, y: 666, width: 95, height: 115 },
    });

    expect(measured.unit).toBe(164);
    expect(measured.rim).toEqual({ left: 295, right: 459, y: 443 });
    expect(measured.netBottom).toBe(547);
    expect(measured.rest).toEqual({ x: 187.5, y: 673.5 });
    expect(measured.board).toEqual(court.board);
  });
});

describe('step', () => {
  it('scores a card that comes down through the rim', () => {
    const center = rimCenter(court);
    const { event, body } = run(
      launch({ x: center.x, y: 436 }, { x: 0, y: 50 })
    );

    expect(event).toBe('score');
    expect(body.y).toBe(court.rim.y);
  });

  it('lets a rising card pass in front of the hoop', () => {
    const center = rimCenter(court);
    let body = launch({ x: center.x, y: 520 }, { x: 0, y: -1400 });
    const events: string[] = [];
    while (body.velocityY < 0) {
      const result = step(body, court);
      body = result.body;
      events.push(...result.events);
    }

    expect(body.y).toBeLessThan(court.rim.y);
    expect(events).toEqual([]);
  });

  it('only stops a card at the rim once it falls', () => {
    const rising = step(launch({ x: 290, y: 446 }, { x: 0, y: -900 }), court);
    expect(rising.events).not.toContain('rim');
  });

  it('takes most of the speed away on the square, only once', () => {
    const start = launch({ x: 305, y: 380 }, { x: 600, y: 0 });
    const first = step(start, court);

    expect(first.events).toContain('board');
    expect(first.body.velocityX).toBeCloseTo(600 * PHYSICS.board.x);
    expect(first.body.boarded).toBe(true);
    expect(step(first.body, court).events).not.toContain('board');
  });

  it('deflects a card that lands on an end of the rim', () => {
    const { event } = run(launch({ x: 290, y: 436 }, { x: 0, y: 50 }), [
      'rim',
      'score',
    ]);
    expect(event).toBe('rim');
  });

  it('bounces off the floor, losing speed', () => {
    const floor = court.bounds.height - PHYSICS.floorRadius * court.unit;
    const result = step(
      launch({ x: 120, y: floor - 1 }, { x: 100, y: 900 }),
      court
    );

    expect(result.events).toContain('floor');
    expect(result.body.velocityY).toBeLessThan(0);
    expect(Math.abs(result.body.velocityY)).toBeLessThan(900);
  });

  it('keeps a card below the floor on it, without turning it back down', () => {
    const floor = court.bounds.height - PHYSICS.floorRadius * court.unit;
    const result = step(
      launch({ x: 120, y: floor + 20 }, { x: 0, y: -300 }),
      court
    );

    expect(result.events).toContain('floor');
    expect(result.body.y).toBe(floor);
    expect(result.body.velocityY).toBeLessThan(0);
  });

  it('bounces off the walls and the ceiling, losing speed', () => {
    const edge = PHYSICS.floorRadius * court.unit;

    const left = step(
      launch({ x: edge + 1, y: 300 }, { x: -900, y: 0 }),
      court
    );
    expect(left.events).toEqual(['wall']);
    expect(left.body.x).toBe(edge);
    expect(left.body.velocityX).toBeCloseTo(900 * PHYSICS.restitution.wall);

    const right = step(
      launch({ x: court.bounds.width - edge - 1, y: 300 }, { x: 900, y: 0 }),
      court
    );
    expect(right.events).toEqual(['wall']);
    expect(right.body.x).toBe(court.bounds.width - edge);
    expect(right.body.velocityX).toBeCloseTo(-900 * PHYSICS.restitution.wall);

    const ceiling = step(
      launch({ x: 120, y: edge + 1 }, { x: 0, y: -900 }),
      court
    );
    expect(ceiling.events).toEqual(['wall']);
    expect(ceiling.body.y).toBe(edge);
    expect(ceiling.body.velocityY).toBeGreaterThan(0);
  });

  it('stays finite when a card lands exactly on an end of the rim', () => {
    const still = -PHYSICS.gravity * court.unit * PHYSICS.step;
    const result = step(
      launch({ x: court.rim.left, y: court.rim.y }, { x: 0, y: still }),
      court
    );

    const { x, y, velocityX, velocityY } = result.body;
    expect([x, y, velocityX, velocityY].every(Number.isFinite)).toBe(true);
    expect({ x, y }).toEqual({ x: court.rim.left, y: court.rim.y });
    expect(result.events).toEqual([]);
  });
});

describe('previewPath', () => {
  it('puts every dot exactly where the card will be', () => {
    const start = launch(court.rest, solveAssistedShot(court.rest, court));
    const preview = previewPath(start, court);
    expect(preview.dots.length).toBeGreaterThan(3);

    let body = start;
    for (const dot of preview.dots) {
      while (body.steps < dot.steps) body = step(body, court).body;
      expect({ x: body.x, y: body.y }).toEqual({ x: dot.x, y: dot.y });
    }
  });

  it('spaces the dots one dot interval apart, and ends on the first event', () => {
    const start = launch(court.rest, solveAssistedShot(court.rest, court));
    const preview = previewPath(start, court);
    const every = Math.round(PHYSICS.dotInterval / PHYSICS.step);
    const last = preview.dots.at(-1);

    preview.dots.slice(0, -1).forEach((dot, index) => {
      expect(dot.steps).toBe((index + 1) * every);
    });
    expect(preview.end).not.toBeNull();
    expect(last?.steps).toBe(preview.steps);
  });

  it('gives up after the maximum preview time when nothing is hit', () => {
    const open = {
      ...court,
      bounds: { x: -1e6, y: -1e6, width: 2e6, height: 2e6 },
    };
    const preview = previewPath(launch({ x: 0, y: 0 }, { x: -50, y: 0 }), open);

    expect(preview.end).toBeNull();
    expect(preview.steps).toBe(
      Math.round(PHYSICS.maxPreviewTime / PHYSICS.step)
    );
  });
});
