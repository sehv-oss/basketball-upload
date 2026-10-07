import { PHYSICS } from './config.ts';
import { contains, rimCenter, type Court } from './court.ts';
import type { Vec } from './vector.ts';

/**
 * State of a card in the air. Plain data: the same body always steps the same way.
 */
export interface Body {
  readonly x: number;

  readonly y: number;

  readonly vx: number;

  readonly vy: number;

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

export interface StepResult {
  readonly body: Body;
  readonly events: readonly ShotEvent[];
}

export function launch(position: Vec, velocity: Vec): Body {
  return {
    x: position.x,
    y: position.y,
    vx: velocity.x,
    vy: velocity.y,
    steps: 0,
    boarded: false,
  };
}

export function timeOf(body: Body): number {
  return body.steps * PHYSICS.step;
}

/**
 * Advances a body by one fixed step (`PHYSICS.step`).
 */
export function step(body: Body, court: Court): StepResult {
  const dt = PHYSICS.step;
  const u = court.unit;
  const events: ShotEvent[] = [];

  let vx = body.vx;
  let vy = body.vy + PHYSICS.gravity * u * dt;
  let x = body.x + vx * dt;
  let y = body.y + vy * dt;
  let boarded = body.boarded;
  const steps = body.steps + 1;

  const { left, right, y: rimY } = court.rim;
  const center = rimCenter(court).x;
  const hit = PHYSICS.hitRadius * u;

  const atHoopDepth = body.vy > -PHYSICS.hoopDepthRise * u;

  if (body.y < rimY && y >= rimY) {
    const t = (rimY - body.y) / (y - body.y);
    const crossX = body.x + (x - body.x) * t;
    if (Math.abs(crossX - center) < (right - left) / 2 - hit * 0.6) {
      return {
        body: { x: crossX, y: rimY, vx, vy, steps, boarded },
        events: ['score'],
      };
    }
  }

  const reach = hit + PHYSICS.rimRadius * u;
  for (const end of atHoopDepth ? [left, right] : []) {
    const dx = x - end;
    const dy = y - rimY;
    const distance = Math.hypot(dx, dy);
    if (distance >= reach || distance === 0) continue;

    const nx = dx / distance;
    const ny = dy / distance;
    x = end + nx * reach;
    y = rimY + ny * reach;
    const along = vx * nx + vy * ny;
    if (along < 0) {
      vx -= (1 + PHYSICS.restitution.rim) * along * nx;
      vy -= (1 + PHYSICS.restitution.rim) * along * ny;
    }
    events.push('rim');
  }

  if (!boarded && atHoopDepth && contains(court.square, { x, y })) {
    boarded = true;
    vx *= PHYSICS.board.x;
    vy *= PHYSICS.board.y;
    events.push('board');
  }

  const { bounds } = court;
  const edge = PHYSICS.floorRadius * u;
  const floor = bounds.y + bounds.height - edge;
  if (y > floor) {
    y = floor;
    if (vy > 0) vy = -vy * PHYSICS.restitution.floor;
    vx *= PHYSICS.floorFriction;
    events.push('floor');
  }
  if (x < bounds.x + edge) {
    x = bounds.x + edge;
    vx = Math.abs(vx) * PHYSICS.restitution.wall;
    events.push('wall');
  } else if (x > bounds.x + bounds.width - edge) {
    x = bounds.x + bounds.width - edge;
    vx = -Math.abs(vx) * PHYSICS.restitution.wall;
    events.push('wall');
  }
  if (y < bounds.y + edge && vy < 0) {
    y = bounds.y + edge;
    vy = Math.abs(vy) * PHYSICS.restitution.wall;
    events.push('wall');
  }

  return { body: { x, y, vx, vy, steps, boarded }, events };
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
