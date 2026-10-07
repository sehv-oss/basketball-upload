import { describe, expect, it, vi } from 'vitest';

import { UploadQueue } from '../../src/upload/upload-queue.ts';
import type { UploadContext, Uploader } from '../../src/upload/types.ts';

interface Call {
  file: File;
  context: UploadContext;
  resolve(value: unknown): void;
  reject(reason: unknown): void;
}

function controlledUploader(): { uploader: Uploader; calls: Call[] } {
  const calls: Call[] = [];
  const uploader: Uploader = (file, context) =>
    new Promise((resolve, reject) => {
      calls.push({ file, context, resolve, reject });
    });
  return { uploader, calls };
}

const file = (name: string, size = 100): File =>
  new File([new Uint8Array(size)], name, { type: 'application/pdf' });

const flush = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve));

describe('UploadQueue', () => {
  it('keeps files ready when there is no uploader', () => {
    const queue = new UploadQueue();
    const item = queue.add(file('a.pdf'));

    expect(item.status).toBe('ready');
    expect(item.progress).toBe(1);
    expect(queue.items).toHaveLength(1);
  });

  it('runs at most `concurrency` uploads at a time', async () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader, concurrency: 2 });
    const [a, b, c] = ['a.pdf', 'b.pdf', 'c.pdf'].map((name) =>
      queue.add(file(name))
    );

    expect(calls).toHaveLength(2);
    expect(queue.get(c!.id)?.status).toBe('queued');

    calls[0]!.resolve({ ok: true });
    await flush();

    expect(queue.get(a!.id)).toMatchObject({
      status: 'uploaded',
      progress: 1,
      response: { ok: true },
    });
    expect(queue.get(b!.id)?.status).toBe('uploading');
    expect(queue.get(c!.id)?.status).toBe('uploading');
    expect(calls).toHaveLength(3);
  });

  it('reports progress against the size of the file by default', () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const progress = vi.fn();
    queue.on('progress', progress);
    const item = queue.add(file('a.pdf', 200));

    calls[0]!.context.onProgress(50);
    expect(queue.get(item.id)?.progress).toBe(0.25);
    calls[0]!.context.onProgress(30, 40);
    expect(queue.get(item.id)?.progress).toBe(0.75);
    expect(progress).toHaveBeenCalledTimes(2);
  });

  it('marks failures, and retries them', async () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const item = queue.add(file('a.pdf'));

    calls[0]!.reject(new Error('offline'));
    await flush();
    expect(queue.get(item.id)).toMatchObject({
      status: 'error',
      error: new Error('offline'),
    });

    expect(queue.retry(item.id)).toBe(true);
    expect(queue.get(item.id)).toMatchObject({
      status: 'uploading',
      progress: 0,
      error: undefined,
    });
    expect(calls).toHaveLength(2);
  });

  it('only retries failed items', () => {
    const { uploader } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const item = queue.add(file('a.pdf'));

    expect(queue.retry(item.id)).toBe(false);
    expect(queue.retry('missing')).toBe(false);
  });

  it('aborts an upload when its item is removed, and starts the next one', () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader, concurrency: 1 });
    const first = queue.add(file('a.pdf'));
    queue.add(file('b.pdf'));

    expect(queue.remove(first.id)).toBe(true);
    expect(calls[0]!.context.signal.aborted).toBe(true);
    expect(calls).toHaveLength(2);
    expect(queue.items.map((item) => item.file.name)).toEqual(['b.pdf']);
  });

  it('ignores the outcome of aborted uploads', async () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const success = vi.fn();
    queue.on('success', success);
    queue.add(file('a.pdf'));

    queue.clear();
    calls[0]!.resolve('late');
    await flush();

    expect(calls[0]!.context.signal.aborted).toBe(true);
    expect(success).not.toHaveBeenCalled();
    expect(queue.items).toHaveLength(0);
  });

  it('turns a synchronous throw into a failure', async () => {
    const queue = new UploadQueue({
      uploader: () => {
        throw new Error('boom');
      },
    });
    const item = queue.add(file('a.pdf'));
    await flush();

    expect(queue.get(item.id)?.status).toBe('error');
  });

  it('emits change for every update, and the lifecycle events', async () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const events: string[] = [];
    for (const type of ['start', 'success', 'error'] as const) {
      queue.on(type, () => events.push(type));
    }
    const change = vi.fn();
    queue.on('change', change);

    queue.add(file('a.pdf'));
    calls[0]!.resolve(undefined);
    await flush();

    expect(events).toEqual(['start', 'success']);
    expect(change).toHaveBeenCalled();
  });

  it('falls back to the default concurrency for values below one', () => {
    for (const concurrency of [0, -2, 0.5, Number.NaN]) {
      expect(new UploadQueue({ concurrency }).concurrency).toBe(3);
    }
    expect(new UploadQueue({ concurrency: 2.9 }).concurrency).toBe(2);

    const queue = new UploadQueue({ concurrency: 1 });
    queue.concurrency = -1;
    expect(queue.concurrency).toBe(3);
  });

  it('starts waiting uploads when the concurrency rises', () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader, concurrency: 1 });
    for (const name of ['a.pdf', 'b.pdf', 'c.pdf']) queue.add(file(name));
    expect(calls).toHaveLength(1);

    queue.concurrency = 3;

    expect(calls).toHaveLength(3);
    expect(queue.items.every((item) => item.status === 'uploading')).toBe(true);
  });

  it('keeps progress between 0 and 1', () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const item = queue.add(file('a.pdf', 100));
    const empty = queue.add(file('empty.pdf', 0));

    calls[0]!.context.onProgress(-10);
    expect(queue.get(item.id)?.progress).toBe(0);
    calls[0]!.context.onProgress(500, 100);
    expect(queue.get(item.id)?.progress).toBe(1);
    calls[1]!.context.onProgress(0);
    expect(queue.get(empty.id)?.progress).toBe(0);
  });

  it('ignores progress and failures of aborted uploads', async () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const progress = vi.fn();
    const error = vi.fn();
    queue.on('progress', progress);
    queue.on('error', error);
    const item = queue.add(file('a.pdf'));

    queue.remove(item.id);
    calls[0]!.context.onProgress(50);
    calls[0]!.reject(new Error('aborted'));
    await flush();

    expect(progress).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(queue.items).toHaveLength(0);
  });

  it('does not retry once the uploader is gone', async () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const item = queue.add(file('a.pdf'));
    calls[0]!.reject(new Error('offline'));
    await flush();

    queue.uploader = null;

    expect(queue.retry(item.id)).toBe(false);
    expect(queue.get(item.id)?.status).toBe('error');
  });

  it('only uploads the files added after the uploader is set', () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue();
    const before = queue.add(file('before.pdf'));

    queue.uploader = uploader;
    const after = queue.add(file('after.pdf'));

    expect(queue.get(before.id)?.status).toBe('ready');
    expect(queue.get(after.id)?.status).toBe('uploading');
    expect(calls.map((call) => call.file.name)).toEqual(['after.pdf']);
  });

  it('accepts an uploader that returns a plain value', async () => {
    const queue = new UploadQueue({
      uploader: (() => 'stored') as unknown as Uploader,
    });
    const item = queue.add(file('a.pdf'));
    await flush();

    expect(queue.get(item.id)).toMatchObject({
      status: 'uploaded',
      response: 'stored',
    });
  });

  it('gives the same file added twice two items', () => {
    const queue = new UploadQueue();
    const same = file('a.pdf');
    const first = queue.add(same);
    const second = queue.add(same);

    expect(first.id).not.toBe(second.id);
    expect(queue.remove(first.id)).toBe(true);
    expect(queue.items).toEqual([second]);
  });

  it('changes nothing when removing an unknown item or clearing an empty queue', () => {
    const queue = new UploadQueue();
    const change = vi.fn();
    queue.on('change', change);

    expect(queue.remove('missing')).toBe(false);
    queue.clear();

    expect(change).not.toHaveBeenCalled();
  });

  it('copes with an item removed while its upload starts', async () => {
    const { uploader, calls } = controlledUploader();
    const queue = new UploadQueue({ uploader });
    const start = vi.fn();
    const success = vi.fn();
    queue.on('start', start);
    queue.on('success', success);
    queue.on('change', (items) => {
      const uploading = items.find((item) => item.status === 'uploading');
      if (uploading) queue.remove(uploading.id);
    });

    queue.add(file('a.pdf'));
    calls[0]!.resolve('late');
    await flush();

    expect(calls[0]!.context.signal.aborted).toBe(true);
    expect(start).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(queue.items).toHaveLength(0);
  });
});
