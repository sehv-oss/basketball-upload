export interface Vector {
  readonly x: number;
  readonly y: number;
}

export function scale(vector: Vector, factor: number): Vector {
  return { x: vector.x * factor, y: vector.y * factor };
}

export function length(vector: Vector): number {
  return Math.hypot(vector.x, vector.y);
}

/**
 * `vector` turned by `degrees`, clockwise on screen (y points down).
 */
export function rotate(vector: Vector, degrees: number): Vector {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

/**
 * `vector` shortened to `max` when longer; unchanged otherwise.
 */
export function limit(vector: Vector, max: number): Vector {
  const size = length(vector);
  return size > max ? scale(vector, max / size) : vector;
}
