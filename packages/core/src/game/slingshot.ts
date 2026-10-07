import { PHYSICS } from './config.ts';
import { rimCenter, type Court } from './court.ts';
import { length, limit, rotate, scale, type Vector } from './vector.ts';

/**
 * Where the card is drawn while pulled: it follows the pointer up to the
 * maximum pull, then only by a fraction of the extra distance.
 */
export function stretchPull(pull: Vector, unit: number): Vector {
  const max = PHYSICS.maxPull * unit;
  const size = length(pull);
  if (size <= max) return pull;
  return scale(pull, (max + (size - max) * PHYSICS.pullStretch) / size);
}

/**
 * Pulls shorter than this cancel the shot.
 */
export function isPullEnough(pull: Vector, unit: number): boolean {
  return length(pull) >= PHYSICS.minPull * unit;
}

/**
 * Launch velocity of a pull, in px/s: opposite to the pull, like a slingshot.
 */
export function pullToVelocity(
  pull: Vector,
  unit: number,
  power: number
): Vector {
  return scale(limit(pull, PHYSICS.maxPull * unit), -power);
}

/**
 * Aiming with the keyboard: `pull` turned by `degrees` (clockwise on screen)
 * and lengthened by `extra` rim units, between the shortest and the longest pull.
 */
export function steerPull(
  pull: Vector,
  degrees: number,
  extra: number,
  unit: number
): Vector {
  const size = length(pull);
  const steered = Math.min(
    PHYSICS.maxPull * unit,
    Math.max(PHYSICS.minPull * unit, size + extra * unit)
  );

  return scale(rotate(pull, degrees), steered / size);
}

/**
 * Velocity, in px/s, of a shot from `start` that peaks above the square and
 * comes down on the center of the rim. Used for keyboard shots, and to size
 * the slingshot to the layout.
 */
export function solveAssistedShot(start: Vector, court: Court): Vector {
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
 * The pull that launches the assisted shot from where cards rest.
 */
export function assistedPull(court: Court): Vector {
  return scale(solveAssistedShot(court.rest, court), -1 / launchPower(court));
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
export function spinFor(velocity: Vector, unit: number): number {
  const speed = (Math.abs(velocity.x) / unit) * PHYSICS.spin.factor;
  const spin = Math.min(PHYSICS.spin.max, Math.max(PHYSICS.spin.min, speed));
  return velocity.x < 0 ? -spin : spin;
}
