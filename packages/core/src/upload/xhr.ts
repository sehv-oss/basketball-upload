import type { Uploader } from './types.ts';

export interface XhrUploaderOptions {
  /**
   * Endpoint, or a function of the file for one URL per file.
   */
  url: string | URL | ((file: File) => string | URL);

  /**
   * Defaults to `POST`.
   */
  method?: string | undefined;

  /**
   * Form field the file is sent under, as `multipart/form-data`. Defaults to
   * `file`. `null` sends the file itself as the request body.
   */
  fieldName?: string | null | undefined;

  /**
   * Extra form fields, sent before the file. Ignored when `fieldName` is `null`.
   */
  fields?:
    | Record<string, string | Blob>
    | ((file: File) => Record<string, string | Blob>)
    | undefined;

  headers?:
    | Record<string, string>
    | ((file: File) => Record<string, string>)
    | undefined;
  withCredentials?: boolean | undefined;
}

/**
 * Rejection reason of `createXhrUploader` for a non-2xx response or a network error.
 */
export class UploadError extends Error {
  /**
   * HTTP status, or 0 when the request did not complete.
   */
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(
      status === 0 ? 'Network error' : `Upload failed with status ${status}`
    );
    this.name = 'UploadError';
    this.status = status;
    this.body = body;
  }
}

function resolve<T>(value: T | ((file: File) => T), file: File): T {
  return typeof value === 'function'
    ? (value as (file: File) => T)(file)
    : value;
}

function parseResponse(xhr: XMLHttpRequest): unknown {
  const type = xhr.getResponseHeader('content-type') ?? '';
  if (!type.includes('json')) return xhr.responseText;
  try {
    return JSON.parse(xhr.responseText) as unknown;
  } catch {
    return xhr.responseText;
  }
}

/**
 * An `Uploader` built on `XMLHttpRequest`, the one browser API that reports
 * the progress of a request body. Resolves with the parsed JSON response (or
 * its text), rejects with an `UploadError`, or with the abort reason.
 */
export function createXhrUploader(options: XhrUploaderOptions): Uploader {
  return (file, { signal, onProgress }) =>
    new Promise((resolvePromise, reject) => {
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open(options.method ?? 'POST', String(resolve(options.url, file)));
      xhr.withCredentials = options.withCredentials ?? false;
      for (const [name, value] of Object.entries(
        resolve(options.headers ?? {}, file)
      )) {
        xhr.setRequestHeader(name, value);
      }

      xhr.upload.addEventListener('progress', (event) => {
        onProgress(
          event.loaded,
          event.lengthComputable ? event.total : undefined
        );
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolvePromise(parseResponse(xhr));
        } else {
          reject(new UploadError(xhr.status, xhr.responseText));
        }
      });
      xhr.addEventListener('error', () => reject(new UploadError(0, '')));
      xhr.addEventListener('abort', () => reject(signal.reason));
      signal.addEventListener('abort', () => xhr.abort(), { once: true });

      const fieldName =
        options.fieldName === undefined ? 'file' : options.fieldName;
      if (fieldName === null) {
        xhr.send(file);
        return;
      }
      const body = new FormData();
      for (const [name, value] of Object.entries(
        resolve(options.fields ?? {}, file)
      )) {
        body.append(name, value);
      }
      body.append(fieldName, file, file.name);
      xhr.send(body);
    });
}
