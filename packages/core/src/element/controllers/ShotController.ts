import { PHYSICS } from '../../game/config.ts';
import { contains, type Court } from '../../game/court.ts';
import {
  launch,
  previewPath,
  step,
  timeOf,
  type Body,
} from '../../game/simulate.ts';
import {
  isPullEnough,
  launchPower,
  pullToVelocity,
  solveAssistedShot,
  spinFor,
  stretchPull,
} from '../../game/slingshot.ts';
import type { Vec } from '../../game/vector.ts';
import { play, poseStyle, prefersReducedMotion, type Pose } from '../motion.ts';
import type { CardView } from '../views/card.ts';
import type { TrajectoryView } from '../views/trajectory.ts';

/** Rotation of a card resting on the court. Keep in sync with `card.css`. */
export const REST_ROTATION = -6;
/** Cards lift a little while held. */
const GRAB_SCALE = 1.04;
/** Tilt while pulling, in degrees per rim unit of horizontal pull. */
const PULL_TILT = 14;

export interface ShotHost {
  readonly trajectory: TrajectoryView;
  /** The court as currently laid out, or `null` when not rendered. */
  measure(): Court | null;
  setAiming(aiming: boolean): void;
  setFlying(flying: boolean): void;
  /** Whether the flying card is in front of the dropzone. */
  setOverBoard(over: boolean): void;
  /** The card left the court: it is no longer staged. */
  launched(card: CardView): void;
  /** The card went through the rim, drawn at `pose`. */
  scored(card: CardView, pose: Pose, court: Court): void;
  /** The card missed and is back on the court. */
  missed(card: CardView): void;
}

/** Aiming with the pointer, assisted shots, and the flight of the card. */
export class ShotController {
  readonly #host: ShotHost;
  /** The card being aimed or in the air. One shot at a time. */
  #card: CardView | null = null;
  #frame = 0;
  #endAim: (() => void) | null = null;

  constructor(host: ShotHost) {
    this.#host = host;
  }

  get busy(): boolean {
    return this.#card !== null;
  }

  /** Starts aiming: the card follows the pointer like a slingshot pouch. */
  grab(card: CardView, event: PointerEvent): void {
    if (this.#card || event.button !== 0) return;
    const court = this.#host.measure();
    if (!court) return;

    event.preventDefault();
    const { element } = card;
    try {
      // Keeps the pointer events coming while it leaves the card.
      element.setPointerCapture(event.pointerId);
    } catch {
      // Not an active pointer (synthetic events): the card still gets its own.
    }
    this.#card = card;
    this.#host.setAiming(true);

    const power = launchPower(court);
    const origin: Vec = { x: event.clientX, y: event.clientY };
    let pull: Vec = { x: 0, y: 0 };
    let pose: Pose = {
      ...court.rest,
      rotation: REST_ROTATION,
      scale: GRAB_SCALE,
    };
    card.place(pose);

    const listeners = new AbortController();
    const { signal } = listeners;

    const aim = (): void => {
      const shown = stretchPull(pull, court.unit);
      const tilt = Math.max(-1, Math.min(1, shown.x / court.unit)) * PULL_TILT;
      pose = {
        x: court.rest.x + shown.x,
        y: court.rest.y + shown.y,
        rotation: REST_ROTATION + tilt,
        scale: GRAB_SCALE,
      };
      card.place(pose);
      if (isPullEnough(pull, court.unit)) {
        const body = launch(pose, pullToVelocity(pull, court.unit, power));
        this.#host.trajectory.show(previewPath(body, court).dots, court.unit);
      } else {
        this.#host.trajectory.clear();
      }
    };

    const end = (shoot: boolean): void => {
      listeners.abort();
      this.#endAim = null;
      this.#host.setAiming(false);
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }

      if (shoot && isPullEnough(pull, court.unit)) {
        const body = launch(pose, pullToVelocity(pull, court.unit, power));
        this.#host.launched(card);
        this.#fly(card, body, pose.rotation, court);
        return;
      }
      this.#host.trajectory.clear();
      void this.#returnToRest(card, pose, court).then(() => {
        this.#card = null;
      });
    };
    this.#endAim = () => end(false);

    element.addEventListener(
      'pointermove',
      (moved) => {
        if (moved.pointerId !== event.pointerId) return;
        pull = { x: moved.clientX - origin.x, y: moved.clientY - origin.y };
        aim();
      },
      { signal }
    );
    element.addEventListener(
      'pointerup',
      (released) => {
        if (released.pointerId === event.pointerId) end(true);
      },
      { signal }
    );
    element.addEventListener(
      'pointercancel',
      (cancelled) => {
        if (cancelled.pointerId === event.pointerId) end(false);
      },
      { signal }
    );
    element.addEventListener(
      'lostpointercapture',
      (lost) => {
        if (lost.pointerId === event.pointerId) end(false);
      },
      { signal }
    );
  }

  /** Drops the current aim; the card goes back to the court. */
  cancelAim(): void {
    this.#endAim?.();
  }

  /** A perfect shot from the court, for the keyboard and `shoot()`. */
  shoot(card: CardView): boolean {
    if (this.#card) return false;
    const court = this.#host.measure();
    if (!court) return false;

    this.#card = card;
    const pose: Pose = { ...court.rest, rotation: REST_ROTATION, scale: 1 };
    card.place(pose);
    const body = launch(pose, solveAssistedShot(court.rest, court));
    this.#host.trajectory.show(previewPath(body, court).dots, court.unit);
    this.#host.launched(card);
    this.#fly(card, body, pose.rotation, court);
    return true;
  }

  /** Stops whatever is going on, leaving the card where it is. */
  stop(): CardView | null {
    this.#endAim?.();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    const card = this.#card;
    this.#card = null;
    this.#host.trajectory.clear();
    this.#host.setFlying(false);
    this.#host.setOverBoard(false);
    return card;
  }

  #fly(card: CardView, start: Body, rotation: number, court: Court): void {
    if (prefersReducedMotion()) {
      this.#card = null;
      this.#host.trajectory.clear();
      this.#host.scored(
        card,
        { x: start.x, y: start.y, rotation, scale: 1 },
        court
      );
      return;
    }

    this.#host.setFlying(true);
    const preview = previewPath(start, court);
    const reachesHoop =
      preview.end === 'board' ||
      preview.end === 'rim' ||
      preview.end === 'score';
    // The card shrinks as it travels away from the viewer, towards the hoop.
    const depthSteps = reachesHoop
      ? Math.max(1, preview.steps)
      : Math.round(0.6 / PHYSICS.step);

    let body = start;
    let angle = rotation;
    let spin = spinFor({ x: start.vx, y: start.vy }, court.unit);
    let bounces = 0;
    let carry = 0;
    let last = performance.now();

    const pose = (): Pose => ({
      x: body.x,
      y: body.y,
      rotation: angle,
      scale:
        1 - (1 - PHYSICS.depthScale) * Math.min(1, body.steps / depthSteps),
    });

    const finish = (scored: boolean): void => {
      this.#frame = 0;
      this.#host.trajectory.clear();
      this.#host.setFlying(false);
      // The score sequence keeps the dropzone lit on its own.
      this.#host.setOverBoard(false);
      const final = pose();
      card.place(final);
      if (scored) {
        this.#card = null;
        this.#host.scored(card, final, court);
        return;
      }
      void this.#returnToRest(card, final, court).then(() => {
        this.#card = null;
        this.#host.missed(card);
      });
    };

    const frame = (now: number): void => {
      carry += Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      while (carry >= PHYSICS.step) {
        carry -= PHYSICS.step;
        const result = step(body, court);
        body = result.body;
        angle += spin * PHYSICS.step;

        if (result.events.includes('score')) {
          finish(true);
          return;
        }
        if (result.events.includes('board') || result.events.includes('rim')) {
          spin *= 0.6;
        }
        if (result.events.includes('floor')) {
          bounces += 1;
          spin *= 0.5;
        }
        if (
          bounces > PHYSICS.maxFloorBounces ||
          timeOf(body) > PHYSICS.maxFlightTime
        ) {
          finish(false);
          return;
        }
      }
      card.place(pose());
      this.#host.trajectory.hideBefore(body.steps);
      this.#host.setOverBoard(contains(court.board, body));
      this.#frame = requestAnimationFrame(frame);
    };
    this.#frame = requestAnimationFrame(frame);
  }

  async #returnToRest(card: CardView, from: Pose, court: Court): Promise<void> {
    const rest: Pose = { ...court.rest, rotation: REST_ROTATION, scale: 1 };
    const { width, height } = card.size();
    await play(
      card.element,
      [poseStyle(from, width, height), poseStyle(rest, width, height)],
      {
        duration: prefersReducedMotion() ? 0 : 520,
        easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
        commit: true,
      }
    );
    card.release();
  }
}
