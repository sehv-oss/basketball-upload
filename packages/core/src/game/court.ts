import type { Vec } from './vector.ts';

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Rim {
  readonly left: number;

  readonly right: number;

  /**
   * Height of the rim plane.
   */
  readonly y: number;
}

/**
 * The layout as the simulation sees it, in pixels relative to the element.
 * CSS owns the layout; the game only measures it (see `courtFromRects`).
 */
export interface Court {
  /**
   * Rim width in pixels: the `u` the physics constants are expressed in.
   */
  readonly unit: number;

  /**
   * Play area: walls, ceiling and floor.
   */
  readonly bounds: Rect;

  /**
   * The dropzone, which doubles as the backboard.
   */
  readonly board: Rect;

  /**
   * The orange target square on the board.
   */
  readonly square: Rect;

  readonly rim: Rim;

  /**
   * Bottom edge of the net, where scored cards come to rest.
   */
  readonly netBottom: number;

  /**
   * Center of a staged card.
   */
  readonly rest: Vec;
}

export interface CourtRects {
  readonly host: Rect;

  readonly board: Rect;

  readonly square: Rect;

  /**
   * Bounding box of the rim drawing: the rim plane is its vertical center.
   */
  readonly rim: Rect;

  readonly net: Rect;

  /**
   * Box a staged card rests in.
   */
  readonly spot: Rect;
}

function relative(rect: Rect, origin: Rect): Rect {
  return {
    x: rect.x - origin.x,
    y: rect.y - origin.y,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Builds a court from client rectangles (`getBoundingClientRect`).
 */
export function courtFromRects(rects: CourtRects): Court {
  const { host } = rects;
  const rim = relative(rects.rim, host);
  const net = relative(rects.net, host);
  const spot = relative(rects.spot, host);

  return {
    unit: rim.width,
    bounds: { x: 0, y: 0, width: host.width, height: host.height },
    board: relative(rects.board, host),
    square: relative(rects.square, host),
    rim: { left: rim.x, right: rim.x + rim.width, y: rim.y + rim.height / 2 },
    netBottom: net.y + net.height,
    rest: { x: spot.x + spot.width / 2, y: spot.y + spot.height / 2 },
  };
}

export function rimCenter(court: Court): Vec {
  return { x: (court.rim.left + court.rim.right) / 2, y: court.rim.y };
}

export function contains(rect: Rect, point: Vec): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
