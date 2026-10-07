import { EventEmitter } from './EventEmitter.ts';
import type { UploadItem, Uploader } from './types.ts';

export interface UploadQueueEvents {
  /**
   * Any change to the list or to an item, including progress.
   */
  change: readonly UploadItem[];

  start: UploadItem;

  progress: UploadItem;

  success: UploadItem;

  error: UploadItem;
}

export interface UploadQueueOptions {
  uploader?: Uploader | null | undefined;

  /**
   * Uploads running at the same time. Defaults to 3.
   */
  concurrency?: number | undefined;
}

export const DEFAULT_CONCURRENCY = 3;

/**
 * Files accepted by the hoop, and their uploads. Items are immutable
 * snapshots; every change replaces the item and emits `change`.
 */
export class UploadQueue extends EventEmitter<UploadQueueEvents> {
  /**
   * Used for the files added from now on. Without one, files are `ready`.
   */
  uploader: Uploader | null;

  #concurrency: number;
  #items: readonly UploadItem[] = [];
  readonly #controllers = new Map<string, AbortController>();
  #nextId = 0;

  constructor(options: UploadQueueOptions = {}) {
    super();
    this.uploader = options.uploader ?? null;
    this.#concurrency = normalizeConcurrency(options.concurrency);
  }

  get items(): readonly UploadItem[] {
    return this.#items;
  }

  get concurrency(): number {
    return this.#concurrency;
  }

  set concurrency(value: number) {
    this.#concurrency = normalizeConcurrency(value);
    this.#pump();
  }

  get(id: string): UploadItem | undefined {
    return this.#items.find((item) => item.id === id);
  }

  add(file: File): UploadItem {
    this.#nextId += 1;
    const id = `upload-${this.#nextId}`;
    const item: UploadItem = {
      id,
      file,
      status: this.uploader ? 'queued' : 'ready',
      progress: this.uploader ? 0 : 1,
      response: undefined,
      error: undefined,
    };
    this.#items = [...this.#items, item];
    this.emit('change', this.#items);
    this.#pump();
    return this.get(id) ?? item;
  }

  /**
   * Uploads a failed item again. Returns whether there was one to retry.
   */
  retry(id: string): boolean {
    const item = this.get(id);
    if (!item || item.status !== 'error' || !this.uploader) return false;
    this.#update(id, { status: 'queued', progress: 0, error: undefined });
    this.#pump();
    return true;
  }

  /**
   * Removes an item, aborting its upload.
   */
  remove(id: string): boolean {
    if (!this.get(id)) return false;
    this.#controllers.get(id)?.abort();
    this.#controllers.delete(id);
    this.#items = this.#items.filter((item) => item.id !== id);
    this.emit('change', this.#items);
    this.#pump();
    return true;
  }

  /**
   * Removes every item, aborting the uploads in flight.
   */
  clear(): void {
    for (const controller of this.#controllers.values()) controller.abort();
    this.#controllers.clear();
    if (this.#items.length === 0) return;
    this.#items = [];
    this.emit('change', this.#items);
  }

  #pump(): void {
    if (!this.uploader) return;
    let active = this.#items.filter(
      (item) => item.status === 'uploading'
    ).length;
    for (const item of this.#items) {
      if (active >= this.#concurrency) return;
      if (item.status !== 'queued') continue;
      this.#start(item, this.uploader);
      active += 1;
    }
  }

  #start(item: UploadItem, uploader: Uploader): void {
    const { id, file } = item;
    const controller = new AbortController();
    const { signal } = controller;
    this.#controllers.set(id, controller);
    this.#update(id, { status: 'uploading', progress: 0 });
    this.#emitItem('start', id);

    const onProgress = (loaded: number, total: number = file.size): void => {
      if (signal.aborted) return;
      const progress = total > 0 ? Math.min(1, Math.max(0, loaded / total)) : 0;
      this.#update(id, { progress });
      this.#emitItem('progress', id);
    };

    let upload: Promise<unknown>;
    try {
      upload = Promise.resolve(uploader(file, { signal, onProgress }));
    } catch (error) {
      upload = Promise.reject(error);
    }

    upload.then(
      (response) => {
        if (signal.aborted) return;
        this.#controllers.delete(id);
        this.#update(id, { status: 'uploaded', progress: 1, response });
        this.#emitItem('success', id);
        this.#pump();
      },
      (error: unknown) => {
        if (signal.aborted) return;
        this.#controllers.delete(id);
        this.#update(id, { status: 'error', error });
        this.#emitItem('error', id);
        this.#pump();
      }
    );
  }

  #update(id: string, patch: Partial<Omit<UploadItem, 'id' | 'file'>>): void {
    this.#items = this.#items.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    this.emit('change', this.#items);
  }

  #emitItem(
    type: 'start' | 'progress' | 'success' | 'error',
    id: string
  ): void {
    const item = this.get(id);
    if (item) this.emit(type, item);
  }
}

function normalizeConcurrency(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : DEFAULT_CONCURRENCY;
}
