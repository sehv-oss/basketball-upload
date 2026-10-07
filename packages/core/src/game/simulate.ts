import { PHYSICS } from './config.ts';
import { contains, rimCenter, type Court } from './court.ts';
import type { Vector } from './vector.ts';

/**
 * State of a card in the air. Plain data: the same body always steps the same way.
 */
export interface Body {
  readonly x: number;

  readonly y: number;

  readonly velocityX: number;

  readonly velocityY: number;

  /**
   * Number of steps taken since launch. Time is `steps * PHYSICS.step`.
   */
  readonly steps: number;

  /**
   * The board (orange square) absorbs the energy of a shot once.
   */
  readonly boarded: boolean;
}

/**
 * - `board`: the card reached the orange square and lost most of its speed.
 * - `rim`: it bounced off an end of the rim.
 * - `score`: it went down through the rim. The body stops on the rim plane.
 * - `floor` / `wall`: it bounced off the edges of the element.
 */
export type ShotEvent = 'board' | 'rim' | 'score' | 'floor' | 'wall';

/**
 * One step of the simulation.
 */
export interface StepResult {
  /**
   * The body after the step.
   */
  readonly body: Body;

  /**
   * What happened during the step, in the order it was resolved. Usually
   * empty.
   */
  readonly events: readonly ShotEvent[];
}

/**
 * A body at `position`, leaving at `velocity` (pixels per second).
 */
export function launch(position: Vector, velocity: Vector): Body {
  return {
    x: position.x,
    y: position.y,
    velocityX: velocity.x,
    velocityY: velocity.y,
    steps: 0,
    boarded: false,
  };
}

/**
 * Seconds since launch.
 */
export function timeOf(body: Body): number {
  return body.steps * PHYSICS.step;
}

/**
 * Advances a body by one fixed step (`PHYSICS.step`).
 */
export function step(body: Body, court: Court): StepResult {
  const timeStep = PHYSICS.step;
  const { unit } = court;
  const events: ShotEvent[] = [];

  let velocityX = body.velocityX;
  let velocityY = body.velocityY + PHYSICS.gravity * unit * timeStep;
  let x = body.x + velocityX * timeStep;
  let y = body.y + velocityY * timeStep;
  let boarded = body.boarded;
  const steps = body.steps + 1;

  const { left, right, y: rimY } = court.rim;
  const center = rimCenter(court).x;
  const hit = PHYSICS.hitRadius * unit;

  const atHoopDepth = body.velocityY > -PHYSICS.hoopDepthRise * unit;

  if (body.y < rimY && y >= rimY) {
    const fraction = (rimY - body.y) / (y - body.y);
    const crossX = body.x + (x - body.x) * fraction;
    if (Math.abs(crossX - center) < (right - left) / 2 - hit * 0.6) {
      return {
        body: { x: crossX, y: rimY, velocityX, velocityY, steps, boarded },
        events: ['score'],
      };
    }
  }

  const reach = hit + PHYSICS.rimRadius * unit;
  for (const end of atHoopDepth ? [left, right] : []) {
    const offsetX = x - end;
    const offsetY = y - rimY;
    const distance = Math.hypot(offsetX, offsetY);
    if (distance >= reach || distance === 0) continue;

    const normalX = offsetX / distance;
    const normalY = offsetY / distance;
    x = end + normalX * reach;
    y = rimY + normalY * reach;
    const along = velocityX * normalX + velocityY * normalY;
    if (along < 0) {
      velocityX -= (1 + PHYSICS.restitution.rim) * along * normalX;
      velocityY -= (1 + PHYSICS.restitution.rim) * along * normalY;
    }
    events.push('rim');
  }

  if (!boarded && atHoopDepth && contains(court.square, { x, y })) {
    boarded = true;
    velocityX *= PHYSICS.board.x;
    velocityY *= PHYSICS.board.y;
    events.push('board');
  }

  const { bounds } = court;
  const edge = PHYSICS.floorRadius * unit;
  const floor = bounds.y + bounds.height - edge;
  if (y > floor) {
    y = floor;
    if (velocityY > 0) velocityY = -velocityY * PHYSICS.restitution.floor;
    velocityX *= PHYSICS.floorFriction;
    events.push('floor');
  }
  if (x < bounds.x + edge) {
    x = bounds.x + edge;
    velocityX = Math.abs(velocityX) * PHYSICS.restitution.wall;
    events.push('wall');
  } else if (x > bounds.x + bounds.width - edge) {
    x = bounds.x + bounds.width - edge;
    velocityX = -Math.abs(velocityX) * PHYSICS.restitution.wall;
    events.push('wall');
  }
  if (y < bounds.y + edge && velocityY < 0) {
    y = bounds.y + edge;
    velocityY = Math.abs(velocityY) * PHYSICS.restitution.wall;
    events.push('wall');
  }

  return { body: { x, y, velocityX, velocityY, steps, boarded }, events };
}

export interface PreviewDot {
  readonly x: number;

  readonly y: number;

  /**
   * Steps since launch: the dot is behind the card once the card has taken this many.
   */
  readonly steps: number;
}

export interface Preview {
  /**
   * Where the card will be every `PHYSICS.dotInterval`, then where it meets `end`, which is the last dot.
   */
  readonly dots: readonly PreviewDot[];

  /**
   * First thing the card will hit, or `null` when the preview ran out of time.
   */
  readonly end: ShotEvent | null;

  /**
   * Steps until `end` (or until the preview gave up).
   */
  readonly steps: number;
}

/**
 * Runs the very simulation the flight will run, until its first event.
 * The dots are therefore exactly where the card is going to be.
 */
export function previewPath(start: Body, court: Court): Preview {
  const every = Math.round(PHYSICS.dotInterval / PHYSICS.step);
  const limit = Math.round(PHYSICS.maxPreviewTime / PHYSICS.step);
  const dots: PreviewDot[] = [];

  let body = start;
  while (body.steps < limit) {
    const result = step(body, court);
    body = result.body;
    const [event] = result.events;
    if (event) {
      dots.push({ x: body.x, y: body.y, steps: body.steps });
      return { dots, end: event, steps: body.steps };
    }
    if (body.steps % every === 0) {
      dots.push({ x: body.x, y: body.y, steps: body.steps });
    }
  }

  return { dots, end: null, steps: body.steps };
}
