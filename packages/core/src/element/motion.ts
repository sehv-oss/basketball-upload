/** Where a card is drawn: its center, rotation and scale, in layer pixels. */
export interface Pose {
  readonly x: number;
  readonly y: number;
  /** Degrees. */
  readonly rotation: number;
  readonly scale: number;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** The individual transform properties of a pose, for a box of the given size. */
export function poseStyle(
  pose: Pose,
  width: number,
  height: number
): { translate: string; rotate: string; scale: string } {
  return {
    translate: `${pose.x - width / 2}px ${pose.y - height / 2}px`,
    rotate: `${pose.rotation}deg`,
    scale: String(pose.scale),
  };
}

export interface PlayOptions extends KeyframeAnimationOptions {
  /** Keep the last keyframe as inline style once the animation ends. */
  commit?: boolean;
}

/**
 * Runs a Web Animation and resolves when it ends or is cancelled. Resolves
 * at once where the Web Animations API is missing.
 */
export async function play(
  element: Element,
  keyframes: Keyframe[],
  options: PlayOptions = {}
): Promise<void> {
  if (typeof element.animate !== 'function') return;
  const { commit = false, ...timing } = options;
  const animation = element.animate(
    keyframes,
    commit ? { ...timing, fill: 'forwards' } : timing
  );
  try {
    await animation.finished;
  } catch {
    return;
  }
  if (!commit) return;
  try {
    animation.commitStyles();
  } catch {
    // Not rendered (display: none): there is nothing to keep.
  }
  animation.cancel();
}

/** The nearest whole turn, so a spinning card settles upright without unwinding. */
export function uprightOf(rotation: number): number {
  return Math.round(rotation / 360) * 360;
}
