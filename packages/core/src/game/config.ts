/**
 * Physics constants. Lengths are in rim units (`u`, the rim width in pixels)
 * and times in seconds, so a shot behaves the same at any rendered size.
 *
 * Calibrated against the reference design: its aiming dots are 1/15 s apart,
 * advance ≈0.116 u horizontally and lose ≈0.095 u of rise per dot.
 */
export const PHYSICS = {
  /** Fixed simulation step. Preview and flight both advance by exactly this. */
  step: 1 / 120,
  /** Downward acceleration, u/s². */
  gravity: 21,
  /** Launch speed per unit of pull, 1/s. Raised per layout by `launchPower`. */
  power: 12,
  /** Headroom of a full pull over the speed of the assisted shot. */
  powerHeadroom: 1.4,
  /** Longest pull that still adds speed, u. */
  maxPull: 1,
  /** Shorter pulls cancel the shot instead of firing it, u. */
  minPull: 0.12,
  /** Pull beyond the maximum keeps moving the card, damped by this factor. */
  pullStretch: 0.15,
  /** Time between two aiming dots, s. */
  dotInterval: 1 / 15,
  /** The preview stops after this long when nothing is hit, s. */
  maxPreviewTime: 2,
  /** A shot still in the air after this long counts as a miss, s. */
  maxFlightTime: 5,
  /** Collision radius of the card around the rim, u. */
  hitRadius: 0.17,
  /** Half the thickness of the rim, u. */
  rimRadius: 0.02,
  /** Distance from the card center to the floor and walls, u. */
  floorRadius: 0.35,
  /** Card scale when it reaches the hoop: it travels away from the viewer. */
  depthScale: 0.7,
  /**
   * A card rising faster than this (u/s) is still in front of the hoop: the
   * board and the rim only stop cards around the top of their arc or falling.
   */
  hoopDepthRise: 1.5,
  /** Velocity kept after touching the board (the orange square). */
  board: { x: 0.25, y: 0.3 },
  restitution: { rim: 0.45, floor: 0.35, wall: 0.5 },
  /** Horizontal velocity kept on each floor bounce. */
  floorFriction: 0.8,
  /** A missed card stops bouncing after this many floor contacts. */
  maxFloorBounces: 2,
  /** Assisted shots peak this far above the top of the square, u. */
  assistApex: 0.5,
  /** Spin in degrees per second, per u/s of horizontal speed. */
  spin: { factor: 160, min: 180, max: 540 },
} as const;
