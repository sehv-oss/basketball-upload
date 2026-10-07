import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadQueue } from '../../src/upload/upload-queue.ts';
import type { UploadContext } from '../../src/upload/types.ts';
import { createXhrUploader, UploadError } from '../../src/upload/xhr.ts';

/**
 * Records what the uploader asks of `XMLHttpRequest`; the tests play the server.
 */
class FakeXMLHttpRequest extends EventTarget {
  static readonly requests: FakeXMLHttpRequest[] = [];

  readonly upload = new EventTarget();
  readonly headers: Record<string, string> = {};
  method = '';
  url = '';
  withCredentials = false;
  body: unknown = undefined;
  aborted = false;
  status = 0;
  responseText = '';
  #responseHeaders: Record<string, string> = {};

  constructor() {
    super();
    FakeXMLHttpRequest.requests.push(this);
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string): void {
    this.headers[name] = value;
  }

  getResponseHeader(name: string): string | null {
    return this.#responseHeaders[name.toLowerCase()] ?? null;
  }

  send(body: unknown): void {
    this.body = body;
  }

  abort(): void {
    this.aborted = true;
    this.#end('abort');
  }

  progress(loaded: number, total?: number): void {
    this.upload.dispatchEvent(
      Object.assign(new Event('progress'), {
        loaded,
        total: total ?? 0,
        lengthComputable: total !== undefined,
      })
    );
  }

  respond(
    status: number,
    body = '',
    headers: Record<string, string> = {}
  ): void {
    this.status = status;
    this.responseText = body;
    this.#responseHeaders = headers;
    this.#end('load');
  }

  fail(): void {
    this.#end('error');
  }

  #end(type: 'load' | 'error' | 'abort'): void {
    this.dispatchEvent(new Event(type));
    this.dispatchEvent(new Event('loadend'));
  }
}

const pdf = new File([new Uint8Array(200)], 'final_final_v7.pdf', {
  type: 'application/pdf',
});

function context(signal = new AbortController().signal): UploadContext {
  return { signal, onProgress: vi.fn() };
}

function lastRequest(): FakeXMLHttpRequest {
  const request = FakeXMLHttpRequest.requests.at(-1);
  if (!request) throw new Error('No request was sent');

  return request;
}

beforeEach(() => {
  FakeXMLHttpRequest.requests.length = 0;
  vi.stubGlobal('XMLHttpRequest', FakeXMLHttpRequest);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createXhrUploader', () => {
  it('posts the file as multipart form data under `file`', () => {
    void createXhrUploader({ url: '/upload' })(pdf, context());
    const request = lastRequest();

    expect(request.method).toBe('POST');
    expect(request.url).toBe('/upload');
    expect(request.withCredentials).toBe(false);
    expect(request.body).toBeInstanceOf(FormData);
    expect((request.body as FormData).get('file')).toMatchObject({
      name: 'final_final_v7.pdf',
      size: 200,
    });
  });

  it('sends the extra fields before the file, under its field name', () => {
    void createXhrUploader({
      url: '/upload',
      fieldName: 'document',
      fields: { folder: 'invoices' },
    })(pdf, context());
    const body = lastRequest().body as FormData;

    expect([...body.keys()]).toEqual(['folder', 'document']);
    expect(body.get('folder')).toBe('invoices');
  });

  it('computes the url, the headers and the fields from the file', () => {
    void createXhrUploader({
      url: (file) => new URL(`https://example.com/files/${file.name}`),
      headers: (file) => ({ 'X-File-Size': String(file.size) }),
      fields: (file) => ({ type: file.type }),
    })(pdf, context());
    const request = lastRequest();

    expect(request.url).toBe('https://example.com/files/final_final_v7.pdf');
    expect(request.headers).toEqual({ 'X-File-Size': '200' });
    expect((request.body as FormData).get('type')).toBe('application/pdf');
  });

  it('sends the file itself, without fields, when the field name is null', () => {
    void createXhrUploader({
      url: '/upload',
      method: 'PUT',
      fieldName: null,
      fields: { ignored: 'yes' },
      withCredentials: true,
    })(pdf, context());
    const request = lastRequest();

    expect(request.method).toBe('PUT');
    expect(request.withCredentials).toBe(true);
    expect(request.body).toBe(pdf);
  });

  it('reports progress, leaving an unknown total to the queue', () => {
    const upload = context();
    void createXhrUploader({ url: '/upload' })(pdf, upload);

    lastRequest().progress(50, 200);
    lastRequest().progress(80);

    expect(upload.onProgress).toHaveBeenNthCalledWith(1, 50, 200);
    expect(upload.onProgress).toHaveBeenNthCalledWith(2, 80, undefined);
  });

  it('resolves with the parsed JSON response', async () => {
    const upload = createXhrUploader({ url: '/upload' })(pdf, context());
    lastRequest().respond(201, '{"id":7}', {
      'content-type': 'application/json; charset=utf-8',
    });

    await expect(upload).resolves.toEqual({ id: 7 });
  });

  it('resolves with the text of other responses, and of invalid JSON', async () => {
    const uploader = createXhrUploader({ url: '/upload' });

    const text = uploader(pdf, context());
    lastRequest().respond(200, 'stored', { 'content-type': 'text/plain' });
    await expect(text).resolves.toBe('stored');

    const untyped = uploader(pdf, context());
    lastRequest().respond(204);
    await expect(untyped).resolves.toBe('');

    const invalid = uploader(pdf, context());
    lastRequest().respond(200, '{not json', {
      'content-type': 'application/json',
    });
    await expect(invalid).resolves.toBe('{not json');
  });

  it('rejects responses outside the 2xx range with an UploadError', async () => {
    const uploader = createXhrUploader({ url: '/upload' });

    const last2xx = uploader(pdf, context());
    lastRequest().respond(299);
    await expect(last2xx).resolves.toBe('');

    const tooLarge = uploader(pdf, context());
    lastRequest().respond(413, 'Payload Too Large');
    const error = await tooLarge.catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(UploadError);
    expect(error).toMatchObject({
      name: 'UploadError',
      message: 'Upload failed with status 413',
      status: 413,
      body: 'Payload Too Large',
    });

    const redirect = uploader(pdf, context());
    lastRequest().respond(300);
    await expect(redirect).rejects.toMatchObject({ status: 300 });
  });

  it('rejects a network error with a status 0 UploadError', async () => {
    const upload = createXhrUploader({ url: '/upload' })(pdf, context());
    lastRequest().fail();

    await expect(upload).rejects.toMatchObject({
      name: 'UploadError',
      message: 'Network error',
      status: 0,
      body: '',
    });
  });

  it('aborts the request with the signal, rejecting with its reason', async () => {
    const controller = new AbortController();
    const upload = createXhrUploader({ url: '/upload' })(
      pdf,
      context(controller.signal)
    );
    const reason = new Error('removed');
    controller.abort(reason);

    expect(lastRequest().aborted).toBe(true);
    await expect(upload).rejects.toBe(reason);
  });

  it('lets go of the signal once the request ends', async () => {
    const page = new AbortController();
    const uploader = createXhrUploader({ url: '/upload' });

    const stored = uploader(pdf, context(page.signal));
    const storedRequest = lastRequest();
    storedRequest.respond(201);
    await stored;
    const failed = uploader(pdf, context(page.signal));
    const failedRequest = lastRequest();
    failedRequest.fail();
    await failed.catch(() => undefined);

    page.abort();
    expect(storedRequest.aborted).toBe(false);
    expect(failedRequest.aborted).toBe(false);
  });

  it('sends nothing when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort('too late');
    const upload = createXhrUploader({ url: '/upload' })(
      pdf,
      context(controller.signal)
    );

    await expect(upload).rejects.toBe('too late');
    expect(FakeXMLHttpRequest.requests).toHaveLength(0);
  });

  it('is aborted when its item leaves the queue', () => {
    const queue = new UploadQueue({
      uploader: createXhrUploader({ url: '/upload' }),
    });
    const item = queue.add(pdf);
    expect(queue.get(item.id)?.status).toBe('uploading');

    queue.remove(item.id);
    expect(lastRequest().aborted).toBe(true);
  });
});
