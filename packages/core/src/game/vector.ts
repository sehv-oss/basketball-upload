export interface Vec {
  readonly x: number;
  readonly y: number;
}

export function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec, factor: number): Vec {
  return { x: v.x * factor, y: v.y * factor };
}

export function length(v: Vec): number {
  return Math.hypot(v.x, v.y);
}

/** `v` shortened to `max` when longer; unchanged otherwise. */
export function limit(v: Vec, max: number): Vec {
  const size = length(v);
  return size > max ? scale(v, max / size) : v;
}
