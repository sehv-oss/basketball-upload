import { describe, expect, it } from 'vitest';

import { PHYSICS } from '../../src/game/config.ts';
import { launch, step, type Body } from '../../src/game/simulate.ts';
import {
  assistedPull,
  isPullEnough,
  launchPower,
  pullToVelocity,
  solveAssistedShot,
  spinFor,
  steerPull,
  stretchPull,
} from '../../src/game/slingshot.ts';
import { length } from '../../src/game/vector.ts';
import { designCourt as court } from './court.fixture.ts';

const unit = court.unit;

function scores(start: Body): boolean {
  let body = start;
  const limit = Math.round(PHYSICS.maxFlightTime / PHYSICS.step);
  while (body.steps < limit) {
    const { body: next, events } = step(body, court);
    body = next;
    if (events.includes('score')) return true;
    if (events.includes('floor')) return false;
  }

  return false;
}

describe('stretchPull', () => {
  it('follows the pointer up to the maximum pull', () => {
    expect(stretchPull({ x: -30, y: 40 }, unit)).toEqual({ x: -30, y: 40 });
  });

  it('only gives a fraction of the extra distance beyond it', () => {
    const pulled = stretchPull({ x: 0, y: unit * 2 }, unit);
    expect(pulled.x).toBe(0);
    expect(pulled.y).toBeCloseTo(unit * (1 + PHYSICS.pullStretch));
  });
});

describe('isPullEnough', () => {
  it('cancels short pulls', () => {
    expect(isPullEnough({ x: 0, y: unit * 0.1 }, unit)).toBe(false);
    expect(isPullEnough({ x: 0, y: unit * 0.2 }, unit)).toBe(true);
  });

  it('accepts a pull of exactly the minimum, and cancels no pull at all', () => {
    expect(isPullEnough({ x: 0, y: PHYSICS.minPull * unit }, unit)).toBe(true);
    expect(isPullEnough({ x: 0, y: 0 }, unit)).toBe(false);
  });
});

describe('pullToVelocity', () => {
  it('launches opposite to the pull', () => {
    const velocity = pullToVelocity({ x: -10, y: 20 }, unit, 12);
    expect(velocity).toEqual({ x: 120, y: -240 });
  });

  it('does not launch without a pull', () => {
    expect(length(pullToVelocity({ x: 0, y: 0 }, unit, 12))).toBe(0);
  });

  it('stops adding speed beyond the maximum pull', () => {
    const atMaxPull = pullToVelocity({ x: 0, y: unit }, unit, 12);
    const beyond = pullToVelocity({ x: 0, y: unit * 3 }, unit, 12);
    expect(beyond).toEqual(atMaxPull);
  });
});

describe('steerPull', () => {
  it('turns clockwise on screen, sending the shot to the right', () => {
    const turned = steerPull({ x: 0, y: 0.5 * unit }, 90, 0, unit);

    expect(turned.x).toBeCloseTo(-0.5 * unit);
    expect(turned.y).toBeCloseTo(0);
  });

  it('lengthens and shortens the pull, in rim units', () => {
    const pull = { x: 0, y: 0.5 * unit };

    expect(steerPull(pull, 0, 0.1, unit).y).toBeCloseTo(0.6 * unit);
    expect(steerPull(pull, 0, -0.1, unit).y).toBeCloseTo(0.4 * unit);
  });

  it('stays between the shortest and the longest pull', () => {
    const longest = steerPull({ x: 0, y: 0.9 * unit }, 0, 0.5, unit);
    const shortest = steerPull({ x: 0, y: 0.2 * unit }, 0, -0.5, unit);

    expect(length(longest)).toBeCloseTo(PHYSICS.maxPull * unit);
    expect(length(shortest)).toBeCloseTo(PHYSICS.minPull * unit);
  });
});

describe('solveAssistedShot', () => {
  it('scores from anywhere on the court', () => {
    for (let x = 80; x <= 700; x += 40) {
      for (let y = 580; y <= 800; y += 40) {
        const start = { x, y };
        expect(
          scores(launch(start, solveAssistedShot(start, court))),
          `from ${x},${y}`
        ).toBe(true);
      }
    }
  });

  it('shoots upwards', () => {
    expect(solveAssistedShot(court.rest, court).y).toBeLessThan(0);
  });
});

describe('launchPower', () => {
  it('lets a full pull outrun the assisted shot from the rest spot', () => {
    const power = launchPower(court);
    const needed = length(solveAssistedShot(court.rest, court));

    expect(power).toBeGreaterThanOrEqual(PHYSICS.power);
    expect(power * PHYSICS.maxPull * unit).toBeGreaterThan(needed);
  });

  it('can reproduce the assisted shot with a pull short of the maximum', () => {
    const power = launchPower(court);
    const pull = assistedPull(court);

    expect(length(pull)).toBeLessThan(PHYSICS.maxPull * unit);
    expect(scores(launch(court.rest, pullToVelocity(pull, unit, power)))).toBe(
      true
    );
  });
});

describe('spinFor', () => {
  it('spins in the direction of travel, within limits', () => {
    expect(spinFor({ x: 400, y: -900 }, unit)).toBeGreaterThan(0);
    expect(spinFor({ x: -400, y: -900 }, unit)).toBeLessThan(0);
    expect(spinFor({ x: 0, y: -900 }, unit)).toBe(PHYSICS.spin.min);
    expect(spinFor({ x: 1e5, y: 0 }, unit)).toBe(PHYSICS.spin.max);
    expect(spinFor({ x: -1e5, y: 0 }, unit)).toBe(-PHYSICS.spin.max);
  });
});
