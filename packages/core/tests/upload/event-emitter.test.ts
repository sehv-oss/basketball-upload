import { describe, expect, it, vi } from 'vitest';

import { EventEmitter } from '../../src/upload/event-emitter.ts';

interface Events {
  ping: number;
  pong: string;
}

describe('EventEmitter', () => {
  it('calls the listeners of a type in subscription order', () => {
    const emitter = new EventEmitter<Events>();
    const calls: string[] = [];
    emitter.on('ping', (value) => calls.push(`first ${value}`));
    emitter.on('ping', (value) => calls.push(`second ${value}`));
    emitter.on('pong', (value) => calls.push(`pong ${value}`));

    emitter.emit('ping', 1);

    expect(calls).toEqual(['first 1', 'second 1']);
  });

  it('ignores events nobody listens to', () => {
    const emitter = new EventEmitter<Events>();

    expect(() => emitter.emit('ping', 1)).not.toThrow();
  });

  it('stops calling a listener once unsubscribed', () => {
    const emitter = new EventEmitter<Events>();
    const listener = vi.fn();
    const unsubscribe = emitter.on('ping', listener);

    emitter.emit('ping', 1);
    unsubscribe();
    unsubscribe();
    emitter.emit('ping', 2);

    expect(listener).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('finishes an emit even when a listener unsubscribes another', () => {
    const emitter = new EventEmitter<Events>();
    const second = vi.fn();
    let unsubscribeSecond = (): void => {};
    emitter.on('ping', () => unsubscribeSecond());
    unsubscribeSecond = emitter.on('ping', second);

    emitter.emit('ping', 1);
    emitter.emit('ping', 2);

    expect(second).toHaveBeenCalledExactlyOnceWith(1);
  });
});
