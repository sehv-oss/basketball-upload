export type Listener<TDetail> = (detail: TDetail) => void;

/**
 * Minimal typed emitter. Listeners run synchronously, in subscription order.
 */
export class EventEmitter<TEvents extends object> {
  readonly #listeners = new Map<keyof TEvents, Set<Listener<never>>>();

  on<TType extends keyof TEvents>(
    type: TType,
    listener: Listener<TEvents[TType]>
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

  emit<TType extends keyof TEvents>(type: TType, detail: TEvents[TType]): void {
    const listeners = this.#listeners.get(type);
    if (!listeners) return;
    for (const listener of [...listeners]) {
      (listener as Listener<TEvents[TType]>)(detail);
    }
  }
}
