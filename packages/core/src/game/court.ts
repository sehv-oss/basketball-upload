import type { Vector } from './vector.ts';

export interface Rectangle {
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
 * CSS owns the layout; the game only measures it (see `courtFromRectangles`).
 */
export interface Court {
  /**
   * Rim width in pixels: the `u` the physics constants are expressed in.
   */
  readonly unit: number;

  /**
   * Play area: walls, ceiling and floor.
   */
  readonly bounds: Rectangle;

  /**
   * The dropzone, which doubles as the backboard.
   */
  readonly board: Rectangle;

  /**
   * The orange target square on the board.
   */
  readonly square: Rectangle;

  readonly rim: Rim;

  /**
   * Bottom edge of the net, where scored cards come to rest.
   */
  readonly netBottom: number;

  /**
   * Center of a staged card.
   */
  readonly rest: Vector;
}

export interface CourtRectangles {
  readonly host: Rectangle;

  readonly board: Rectangle;

  readonly square: Rectangle;

  /**
   * Bounding box of the rim drawing: the rim plane is its vertical center.
   */
  readonly rim: Rectangle;

  readonly net: Rectangle;

  /**
   * Box a staged card rests in.
   */
  readonly spot: Rectangle;
}

function relative(rectangle: Rectangle, origin: Rectangle): Rectangle {
  return {
    x: rectangle.x - origin.x,
    y: rectangle.y - origin.y,
    width: rectangle.width,
    height: rectangle.height,
  };
}

/**
 * Builds a court from client rectangles (`getBoundingClientRect`).
 */
export function courtFromRectangles(rectangles: CourtRectangles): Court {
  const { host } = rectangles;
  const rim = relative(rectangles.rim, host);
  const net = relative(rectangles.net, host);
  const spot = relative(rectangles.spot, host);

  return {
    unit: rim.width,
    bounds: { x: 0, y: 0, width: host.width, height: host.height },
    board: relative(rectangles.board, host),
    square: relative(rectangles.square, host),
    rim: { left: rim.x, right: rim.x + rim.width, y: rim.y + rim.height / 2 },
    netBottom: net.y + net.height,
    rest: { x: spot.x + spot.width / 2, y: spot.y + spot.height / 2 },
  };
}

/**
 * Middle of the rim, on the rim plane.
 */
export function rimCenter(court: Court): Vector {
  return { x: (court.rim.left + court.rim.right) / 2, y: court.rim.y };
}

/**
 * Whether `point` is inside `rectangle`, edges included.
 */
export function contains(rectangle: Rectangle, point: Vector): boolean {
  return (
    point.x >= rectangle.x &&
    point.x <= rectangle.x + rectangle.width &&
    point.y >= rectangle.y &&
    point.y <= rectangle.y + rectangle.height
  );
}
