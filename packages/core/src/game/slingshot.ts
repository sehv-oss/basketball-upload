import { PHYSICS } from './config.ts';
import { rimCenter, type Court } from './court.ts';
import { length, limit, scale, type Vec } from './vector.ts';

/**
 * Where the card is drawn while pulled: it follows the pointer up to the
 * maximum pull, then only by a fraction of the extra distance.
 */
export function stretchPull(pull: Vec, unit: number): Vec {
  const max = PHYSICS.maxPull * unit;
  const size = length(pull);
  if (size <= max) return pull;
  return scale(pull, (max + (size - max) * PHYSICS.pullStretch) / size);
}

/**
 * Pulls shorter than this cancel the shot.
 */
export function isPullEnough(pull: Vec, unit: number): boolean {
  return length(pull) >= PHYSICS.minPull * unit;
}

/**
 * Launch velocity of a pull, in px/s: opposite to the pull, like a slingshot.
 */
export function pullToVelocity(pull: Vec, unit: number, power: number): Vec {
  return scale(limit(pull, PHYSICS.maxPull * unit), -power);
}

/**
 * Velocity, in px/s, of a shot from `start` that peaks above the square and
 * comes down on the center of the rim. Used for keyboard shots, and to size
 * the slingshot to the layout.
 */
export function solveAssistedShot(start: Vec, court: Court): Vec {
  const gravity = PHYSICS.gravity * court.unit;
  const target = rimCenter(court);
  const apex =
    Math.min(start.y, court.square.y) - PHYSICS.assistApex * court.unit;

  const rise = start.y - apex;
  const fall = target.y - apex;
  const time =
    Math.sqrt((2 * rise) / gravity) + Math.sqrt((2 * fall) / gravity);

  return {
    x: (target.x - start.x) / time,
    y: -Math.sqrt(2 * gravity * rise),
  };
}

/**
 * Speed per unit of pull for this layout: at least the default, and enough
 * for a full pull to comfortably reach the hoop from where cards rest.
 */
export function launchPower(court: Court): number {
  const needed = length(solveAssistedShot(court.rest, court));
  return Math.max(
    PHYSICS.power,
    (needed * PHYSICS.powerHeadroom) / (PHYSICS.maxPull * court.unit)
  );
}

/**
 * Spin in degrees per second for a launch velocity in px/s.
 */
export function spinFor(velocity: Vec, unit: number): number {
  const speed = (Math.abs(velocity.x) / unit) * PHYSICS.spin.factor;
  const spin = Math.min(PHYSICS.spin.max, Math.max(PHYSICS.spin.min, speed));
  return velocity.x < 0 ? -spin : spin;
}
