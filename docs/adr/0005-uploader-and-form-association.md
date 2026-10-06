# ADR 0005 — Uploads through a function, and form association

**Status:** accepted

## Context

The design shows each scored file uploading with a progress bar, then uploaded with a check. Applications upload in very different ways: multipart to their API, presigned URLs, resumable protocols, or not at all until a form is submitted.

## Decision

The element does not own a transport. Its `uploader` property takes a function:

```ts
type Uploader = (
  file: File,
  context: {
    signal: AbortSignal;
    onProgress(loaded: number, total?: number): void;
  }
) => Promise<unknown>;
```

`UploadQueue` (pure, tested in Node) runs it for every file in the basket, `concurrency` at a time, with statuses `queued`, `uploading`, `uploaded` and `error`, retries, and aborts on removal. `createXhrUploader` covers the common case with `XMLHttpRequest`, the one browser API that reports the progress of a request body.

The element is also a form-associated custom element (`static formAssociated = true`): the files in the basket are its form value under `name` (a `FormData`), `required` sets `valueMissing` with the dropzone as anchor, form resets clear it and disabled fieldsets disable it. Without an uploader, files are `ready` and simply travel with their form.

## Consequences

- Any backend works, including uploading nothing and submitting a classic form.
- `fetch`-based uploaders can only report progress at the end; the XHR helper exists for real progress.
- The counter counts files in the basket, which increments at the score (as in the design, before the upload finishes) and decrements when one is removed.
