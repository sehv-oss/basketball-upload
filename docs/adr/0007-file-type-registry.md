# ADR 0007 — File type registry

**Status:** accepted

## Context

The design shows one PDF, with a red badge. Real uploads mix PDFs, images, videos, spreadsheets, archives and formats specific to an application, and the thrown card is the most visible part of the element: it should say what the file is, and applications should be able to teach it their own formats.

## Decision

A file type is plain data:

```ts
interface FileType {
  kind: string; // → data-kind, ::part(file-<kind>), --basketball-upload-file-<kind>
  match: string | ((file: File) => boolean); // accept syntax, or a predicate
  label?: string | ((file: File) => string); // badge text; defaults to the extension
  color?: string; // badge color
  artwork?: 'lines' | 'thumbnail' | ((file: File) => Node); // card body
}
```

`resolveFileType(file, instanceTypes)` returns the first match among, in order: the element's `fileTypes`, the types registered with `registerFileType()` (most recent first, each registration returning its unregister function), the built-in types (pdf, image, video, audio, sheet, doc, slides, archive, code), and a neutral `file`. String matching reuses the `accept` matcher of the element.

The card writes its color as `var(--basketball-upload-file-<kind>, <color>)`, so CSS can recolor any kind without JavaScript; every card and list icon carries `file-<kind>` / `item-icon-<kind>` parts.

`kind` must be lowercase letters, digits and dashes (it becomes part names): invalid kinds throw at registration.

## Consequences

- Global registration suits design systems; per-element types suit one-off cases and frameworks (the React prop).
- Thumbnails use object URLs, revoked when the card or row goes away; images that fail to decode fall back to lines.
- Labels are text, never HTML. A custom artwork is the application's own node, rendered inside the Shadow DOM: it styles itself.
- The look is resolved when a card is created; changing `fileTypes` affects the files added afterwards.
