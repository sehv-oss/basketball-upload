import type { Uploader } from './types.ts';

/**
 * Options of `createXhrUploader`.
 */
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

  /**
   * Request headers, or a function of the file.
   */
  headers?:
    | Record<string, string>
    | ((file: File) => Record<string, string>)
    | undefined;

  /**
   * Sends cookies with cross-origin requests. Defaults to `false`.
   */
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

  /**
   * Response text, or an empty string when the request did not complete.
   */
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

function resolve<TValue>(
  value: TValue | ((file: File) => TValue),
  file: File
): TValue {
  return typeof value === 'function'
    ? (value as (file: File) => TValue)(file)
    : value;
}

function parseResponse(request: XMLHttpRequest): unknown {
  const type = request.getResponseHeader('content-type') ?? '';
  if (!type.includes('json')) return request.responseText;
  try {
    return JSON.parse(request.responseText) as unknown;
  } catch {
    return request.responseText;
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

      const request = new XMLHttpRequest();
      request.open(
        options.method ?? 'POST',
        String(resolve(options.url, file))
      );
      request.withCredentials = options.withCredentials ?? false;
      for (const [name, value] of Object.entries(
        resolve(options.headers ?? {}, file)
      )) {
        request.setRequestHeader(name, value);
      }

      request.upload.addEventListener('progress', (event) => {
        onProgress(
          event.loaded,
          event.lengthComputable ? event.total : undefined
        );
      });
      request.addEventListener('load', () => {
        if (request.status >= 200 && request.status < 300) {
          resolvePromise(parseResponse(request));
        } else {
          reject(new UploadError(request.status, request.responseText));
        }
      });
      request.addEventListener('error', () => reject(new UploadError(0, '')));
      request.addEventListener('abort', () => reject(signal.reason));
      signal.addEventListener('abort', () => request.abort(), { once: true });

      const fieldName =
        options.fieldName === undefined ? 'file' : options.fieldName;
      if (fieldName === null) {
        request.send(file);
        return;
      }
      const body = new FormData();
      for (const [name, value] of Object.entries(
        resolve(options.fields ?? {}, file)
      )) {
        body.append(name, value);
      }
      body.append(fieldName, file, file.name);
      request.send(body);
    });
}
