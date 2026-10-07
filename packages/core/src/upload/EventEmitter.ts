export type Listener<TDetail> = (detail: TDetail) => void;

/**
 * Minimal typed emitter. Listeners run synchronously, in subscription order.
 */
export class EventEmitter<TEvents extends object> {
  readonly #listeners = new Map<keyof TEvents, Set<Listener<never>>>();

  on<K extends keyof TEvents>(
    type: K,
    listener: Listener<TEvents[K]>
  ): () => void {
    let listeners = this.#listeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.#listeners.set(type, listeners);
    }
    listeners.add(listener as Listener<never>);
    return () => {
      listeners.delete(listener as Listener<never>);
    };
  }

  emit<K extends keyof TEvents>(type: K, detail: TEvents[K]): void {
    const listeners = this.#listeners.get(type);
    if (!listeners) return;
    for (const listener of [...listeners]) {
      (listener as Listener<TEvents[K]>)(detail);
    }
  }
}
