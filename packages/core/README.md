# @sehv-oss/basketball-upload

Drag and drop, or take the shot: a basketball-themed file upload Web Component.

`<basketball-upload>` is a dropzone shaped like a backboard. Files dropped on it go straight through the hoop; files dropped on the court (or picked with the file dialog) wait there as cards, to be pulled back like a slingshot and shot into the basket. Each file that scores is uploaded by your `uploader`, with its progress in a list.

It lives in a Shadow DOM, is themed with CSS custom properties, `::part()` and `:state()`, follows light, dark or system color schemes, and is a form-associated custom element.

**[Live demo](https://sehv-oss.github.io/basketball-upload/)** · React: [`@sehv-oss/basketball-upload-react`](../react)

Design by **Jorge Molina** ([jm-fuster](https://github.com/jm-fuster), [@jm_fuster](https://www.figma.com/@jm_fuster) on Figma Community). This package is an independent implementation of his design; see [NOTICE.md](NOTICE.md).

## Installation

```bash
# npm
npm install @sehv-oss/basketball-upload

# pnpm
pnpm add @sehv-oss/basketball-upload

# yarn
yarn add @sehv-oss/basketball-upload
```

The package is ESM-only and has no dependencies.

## Usage

Registration is explicit: importing the package never defines an element on its own.

```ts
import { registerBasketballUpload } from '@sehv-oss/basketball-upload';

registerBasketballUpload();
```

```html
<basketball-upload multiple accept="image/*,.pdf"></basketball-upload>
```

`registerBasketballUpload` is idempotent and does nothing where `customElements` does not exist, so it is safe to call from any module, including on the server. Pass `tagName` to register under another name: `registerBasketballUpload({ tagName: 'my-upload' })`, then [declare it for TypeScript](#events).

The element is a block that grows with its content (at least `36rem` tall). Its width drives everything else: the hoop is up to `25rem` wide and the shot scales with it.

To avoid a flash of unstyled content before registration:

```css
basketball-upload:not(:defined) {
  visibility: hidden;
}
```

### How files get in

| You…                                                        | The file…                                    |
| ----------------------------------------------------------- | -------------------------------------------- |
| drop it on the dropzone (the backboard)                     | is dunked: it goes straight through the hoop |
| drop it anywhere else, or pick it with the file dialog      | lands on the court, ready to be shot         |
| pull a card back and let go                                 | flies along the dotted arc: score, or miss   |
| focus a card and press <kbd>Enter</kbd> or <kbd>Space</kbd> | takes a perfect, assisted shot               |
| set `instant`                                               | always goes straight in, never to the court  |

A file is in the basket once it goes through the net: it is counted, listed and uploaded. A missed card bounces and comes back to the court.

Clicking the dropzone (or <kbd>Enter</kbd> / <kbd>Space</kbd> on it) opens the file dialog. <kbd>Escape</kbd> drops the current aim. With `prefers-reduced-motion: reduce`, shots go in without flying.

## Uploads

Files are uploaded by a function you provide:

```ts
type Uploader = (
  file: File,
  context: {
    signal: AbortSignal; // aborted when the file is removed or the basket cleared
    onProgress: (loaded: number, total?: number) => void; // total defaults to file.size
  }
) => Promise<unknown>; // resolve when stored, reject when it failed
```

```ts
const hoop = document.querySelector('basketball-upload');

hoop.uploader = async (file, { signal, onProgress }) => {
  const response = await fetch(
    `/api/uploads/${encodeURIComponent(file.name)}`,
    {
      method: 'PUT',
      body: file,
      signal,
    }
  );
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

  onProgress(file.size);

  return response.json();
};
```

`fetch` cannot report the progress of a request body, so the package ships an uploader built on `XMLHttpRequest`, which can:

```ts
import { createXhrUploader } from '@sehv-oss/basketball-upload';

hoop.uploader = createXhrUploader({
  url: '/api/uploads', // or (file) => url
  method: 'POST', // default
  fieldName: 'file', // multipart field; null sends the file as the body
  fields: { folder: 'tickets' }, // extra form fields, or (file) => fields
  headers: { Authorization: `Bearer ${token}` }, // or (file) => headers
  withCredentials: false,
});
```

It resolves with the parsed JSON response (or its text) and rejects with an `UploadError` carrying the HTTP `status` and response `body`.

Up to `concurrency` uploads (3 by default) run at a time; the others wait as `queued`. Failed uploads show a retry button. Without an `uploader`, files are `ready`: they travel with their form (see below) and nothing is sent.

## Forms

`<basketball-upload>` is a form-associated custom element:

```html
<form method="post" enctype="multipart/form-data">
  <basketball-upload name="attachments" multiple required></basketball-upload>
  <button>Send</button>
</form>
```

- The files in the basket are submitted under `name`, like `<input type="file" multiple>`.
- `required` makes the form invalid while the basket is empty; the message anchors on the dropzone.
- Resetting the form empties the element; disabling its `<fieldset>` disables it.
- `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()` and `reportValidity()` work as on native controls.

## API

### Attributes

| Attribute     | Property      | Default  | Description                                                        |
| ------------- | ------------- | -------- | ------------------------------------------------------------------ |
| `theme`       | `theme`       | `system` | `light`, `dark` or `system`                                        |
| `accept`      | `accept`      | `''`     | Accepted files, as in `<input type="file" accept>`: `.pdf,image/*` |
| `multiple`    | `multiple`    | `false`  | Several files. Without it, a new file replaces the previous one    |
| `max-size`    | `maxSize`     | `null`   | Largest accepted file, in bytes                                    |
| `max-files`   | `maxFiles`    | `null`   | Most files at once, on the court and in the basket                 |
| `name`        | `name`        | `''`     | Form field the files are submitted under                           |
| `required`    | `required`    | `false`  | The form is invalid while the basket is empty                      |
| `disabled`    | `disabled`    | `false`  | Ignores files and shots                                            |
| `instant`     | `instant`     | `false`  | No shooting: every file goes straight into the basket              |
| `concurrency` | `concurrency` | `3`      | Uploads running at the same time                                   |

### Properties

| Property    | Type                    | Description                                                         |
| ----------- | ----------------------- | ------------------------------------------------------------------- |
| `uploader`  | `Uploader \| null`      | Sends each file in the basket                                       |
| `messages`  | `Messages`              | Copy and accessible names; assign a partial object to override some |
| `fileTypes` | `readonly FileType[]`   | File types for this element, checked before the registered ones     |
| `items`     | `readonly UploadItem[]` | Files in the basket and their uploads                               |
| `files`     | `readonly File[]`       | Files in the basket: the form value                                 |

```ts
interface UploadItem {
  id: string;
  file: File;
  status: 'ready' | 'queued' | 'uploading' | 'uploaded' | 'error';
  progress: number; // 0 to 1
  response: unknown; // what the uploader resolved with
  error: unknown; // what it rejected with
}
```

### Methods

| Method           | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| `openPicker()`   | Opens the file dialog                                         |
| `stage(files)`   | Puts files on the court, ready to be shot (in with `instant`) |
| `dunk(files)`    | Puts files straight into the basket                           |
| `shoot()`        | Shoots the card on top of the court, with a perfect shot      |
| `retryItem(id)`  | Uploads a failed file again                                   |
| `removeItem(id)` | Takes a file out of the basket, aborting its upload           |
| `clear()`        | Empties the court and the basket, aborting uploads            |

`shoot()`, `retryItem()` and `removeItem()` return whether they did anything: `false` when there is no card on the court (or another one is held or in the air), no failed item with that `id` (or no `uploader`), or no item with that `id`.

### Events

Every event is a `CustomEvent` that bubbles, with its payload in `detail`.

| Event             | `detail`                                        | When                                                    |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `file-reject`     | `{ file, reason: 'type' \| 'size' \| 'count' }` | A file did not pass `accept`, `max-size` or `max-files` |
| `shot`            | `{ file, result: 'score' \| 'miss' }`           | A card went in (or a dunk did), or a shot missed        |
| `upload-start`    | `{ item }`                                      | An upload started                                       |
| `upload-progress` | `{ item }`                                      | The uploader reported progress                          |
| `upload-success`  | `{ item }`                                      | An upload resolved; `item.response` has its value       |
| `upload-error`    | `{ item }`                                      | An upload rejected; `item.error` has the reason         |
| `change`          | `{ items }`                                     | Files entered or left the basket, or changed status     |

```ts
hoop.addEventListener('upload-success', (event) => {
  console.log(event.detail.item.file.name, event.detail.item.response);
});
```

`BasketballUploadEventMap` types `addEventListener` for these events, on the element that `querySelector('basketball-upload')` and `createElement('basketball-upload')` return. Registered under another name, declare that name once in your project, and they return the element for it too:

```ts
import type { BasketballUploadElement } from '@sehv-oss/basketball-upload';

declare global {
  interface HTMLElementTagNameMap {
    'my-upload': BasketballUploadElement;
  }
}
```

### Messages

The default copy is the one of the design. Override any part of it, in any language:

```ts
hoop.messages = {
  title: 'Custom title',
  description: 'Custom description',
  prompt: 'Custom prompt',
  hint: 'Custom hint',
  counter: 'Custom counter',
  uploading: 'Custom uploading',
  uploaded: 'Custom uploaded',
  shoot: (name) => `Custom shoot ${name}`,
};
```

Keys left out, or set to `undefined`, keep their default. See `Messages` and `defaultMessages` for every key: accessible names, statuses, the validation message, and the announcements made to screen readers (`scored`, `missed`, `rejected`, `complete`, `error`).

### Slots

`title`, `description`, `prompt` and `hint` replace the corresponding copy with your own markup:

```html
<basketball-upload>
  <span slot="title">Attachments</span>
  <span slot="hint">PDF or images, up to 20 MB</span>
</basketball-upload>
```

## File types

Each file is drawn as a card of its type: a badge with its label and color, and a body (artwork).

| Kind      | Matches                                  | Color     | Artwork   |
| --------- | ---------------------------------------- | --------- | --------- |
| `pdf`     | `.pdf`, `application/pdf`                | `#d8374e` | lines     |
| `image`   | `image/*`                                | `#2f7cf6` | thumbnail |
| `video`   | `video/*`                                | `#8b5cf6` | lines     |
| `audio`   | `audio/*`                                | `#e39a0b` | lines     |
| `sheet`   | `.csv`, `.tsv`, `.xls`, `.xlsx`, `.ods`… | `#1f9d55` | lines     |
| `doc`     | `.doc`, `.docx`, `.odt`, `.md`, `.txt`…  | `#2563eb` | lines     |
| `slides`  | `.ppt`, `.pptx`, `.key`, `.odp`          | `#ea580c` | lines     |
| `archive` | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`…    | `#6b7280` | lines     |
| `code`    | `.json`, `.js`, `.ts`, `.html`, `.css`…  | `#475569` | lines     |
| `file`    | anything else                            | neutral   | lines     |

The label defaults to the extension, in capitals (at most 4 characters). Image thumbnails use an object URL, revoked when the card goes away.

Add your own types, for every element on the page:

```ts
import { registerFileType } from '@sehv-oss/basketball-upload';

const unregister = registerFileType({
  kind: 'figma', // lowercase letters, digits, dashes
  match: '.fig', // accept syntax, or (file) => boolean
  label: 'FIG', // or (file) => string
  color: '#a259ff', // any CSS color, light-dark() included
  artwork: (file) => figmaLogo(), // 'lines' | 'thumbnail' | (file) => Node
});
```

or for one element, with `fileTypes`. Types are matched in order: the element's, then the registered ones (most recent first), then the built-in ones.

```ts
hoop.fileTypes = [
  { kind: 'contract', match: (file) => file.name.startsWith('contract-') },
];
```

From CSS, every kind has a color token and parts:

```css
basketball-upload {
  --basketball-upload-file-pdf: #e11d48;
}

basketball-upload::part(file-image) {
  filter: drop-shadow(0 0.5rem 1rem rgb(47 124 246 / 0.35));
}
```

Labels are set as text, never as HTML. A custom artwork is your own node, placed in the `file-artwork` part.

## Theming

### Themes

```html
<basketball-upload theme="light"></basketball-upload>
<basketball-upload theme="dark"></basketball-upload>
<basketball-upload theme="system"></basketball-upload>
<!-- no attribute: same as system -->
```

The attribute sets `color-scheme` on the element. Every default color is a `light-dark()` pair, so the dark theme needs no extra stylesheet. Files stay paper-white in both.

### CSS custom properties

Set them on the element or on any ancestor (`:root` included) — they are read once, inside, with their default as fallback. Use `light-dark()` to keep an override theme-aware.

```css
basketball-upload {
  --basketball-upload-accent: light-dark(#0891b2, #22d3ee);
  --basketball-upload-background: transparent;
}
```

| Token                                    | Default (light / dark)                                  |
| ---------------------------------------- | ------------------------------------------------------- |
| `--basketball-upload-background`         | `#eff1f5` / `#0f1115`                                   |
| `--basketball-upload-foreground`         | `#0f1115` / `#f4f5f7`                                   |
| `--basketball-upload-muted-foreground`   | `#6b6f78` / `#a3a8b2`                                   |
| `--basketball-upload-subtle-foreground`  | `#989a9f` / `#7c818b`                                   |
| `--basketball-upload-surface`            | `#ffffff` / `#181b21` (dropzone, list rows)             |
| `--basketball-upload-border`             | `#cbccd1` / `#3a3f48` (dashed outline)                  |
| `--basketball-upload-radius`             | `1.125rem`                                              |
| `--basketball-upload-accent`             | `#f0612e` / `#f26a39` (square, rim, "+1", progress)     |
| `--basketball-upload-accent-strong`      | `#bd4d19` / `#c4521f` (bracket, back of the rim)        |
| `--basketball-upload-accent-surface`     | `#fff4ef` / accent over surface (dropzone while active) |
| `--basketball-upload-trajectory`         | accent at 60%                                           |
| `--basketball-upload-net`                | `#a9abb3` / `#6b717c`                                   |
| `--basketball-upload-counter-background` | `#e3e7ed` / `#232730`                                   |
| `--basketball-upload-track`              | `#e6e8ec` / `#2a2e36` (progress track)                  |
| `--basketball-upload-success`            | `#2fb06d` / `#34c07a`                                   |
| `--basketball-upload-danger`             | `#d8374e` / `#f0606f`                                   |
| `--basketball-upload-file-surface`       | `#ffffff`                                               |
| `--basketball-upload-file-line`          | `#e4e5e9`                                               |
| `--basketball-upload-file-fold`          | `#e9eaee`                                               |
| `--basketball-upload-file-badge`         | `#6b7280` (types without a color)                       |
| `--basketball-upload-file-<kind>`        | the color of each file type                             |
| `--basketball-upload-shadow`             | soft shadow of the list rows                            |
| `--basketball-upload-focus-ring`         | `2px solid` accent                                      |
| `--basketball-upload-font-family`        | `Inter, ui-sans-serif, system-ui, sans-serif`           |
| `--basketball-upload-gutter`             | `clamp(1.25rem, 8cqi, 3.75rem)`                         |
| `--basketball-upload-hoop-size`          | `min(25rem, 100cqi - 2 * gutter)` (dropzone width)      |

No stylesheet needs to be imported. The font is not bundled: load Inter yourself to match the design, or set your own.

### Parts

For anything a token does not cover:

```css
basketball-upload::part(dropzone) {
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
}
```

| Part                                          | Element                             |
| --------------------------------------------- | ----------------------------------- |
| `frame`                                       | Everything inside the element       |
| `header`, `title`, `description`              | The heading                         |
| `counter`, `counter-label`, `counter-value`   | The "Uploaded N" pill               |
| `hoop`                                        | The backboard, rim and net          |
| `dropzone`, `dropzone-icon`, `prompt`, `hint` | The dropzone button and its content |
| `backboard-square`                            | The orange target square            |
| `rim`                                         | Both halves of the rim              |
| `net`                                         | The net                             |
| `score-pop`                                   | The "+1"                            |
| `trajectory`                                  | The aiming dots                     |
| `file`, `file-<kind>`                         | A file card                         |
| `file-artwork`, `file-badge`                  | Its body and its badge              |
| `list`, `item`                                | The upload list and its rows        |
| `item-icon`, `item-icon-<kind>`               | The small card of a row             |
| `item-name`, `item-size`, `item-status`       | Its texts                           |
| `progress`, `retry`                           | Its progress bar and retry button   |

### States

The element exposes what it is doing as custom states, for `:state()`:

| State         | While                                                       |
| ------------- | ----------------------------------------------------------- |
| `dragging`    | Files are dragged over the element                          |
| `drop-target` | Files are over the dropzone, or a card flies over it/scores |
| `aiming`      | A card is pulled back                                       |
| `flying`      | A card is in the air                                        |
| `scoring`     | A card goes through the hoop                                |
| `rejected`    | Just after a file was rejected                              |
| `disabled`    | The element or its fieldset is disabled                     |

```css
basketball-upload:state(drop-target)::part(backboard-square) {
  border-style: dashed;
}
```

Parts, tokens and states are public API: removing or renaming one is a breaking change. Inside, the styles live in cascade layers (`tokens`, `reset`, `layout`, `components`, `states`, `motion`), which outside styles always override.

## Accessibility

- The dropzone is a real button; cards on the court are buttons ("Shoot final.pdf") that shoot with the keyboard.
- Scores, misses, rejections and finished uploads are announced in a polite live region.
- Progress bars are `progressbar`s with their value; retry buttons are labelled.
- With `prefers-reduced-motion: reduce`, nothing flies or swings.

## Server-side rendering

The module can be imported where there is no DOM: the element class extends a stand-in, `registerBasketballUpload` does nothing, and the stylesheet is created on first use. The React component renders the element with its attributes on the server.

## Browser support

Browsers released since mid 2024: Chrome and Edge 125, Firefox 129, Safari 17.5. The element relies on custom elements, Shadow DOM, adopted stylesheets, `ElementInternals` with custom states, cascade layers, CSS nesting, container queries and `light-dark()`.

## Other exports

`defaultMessages`, `defaultFileTypes`, `resolveFileType(file, types?)`, `matchesAccept(file, accept)` and `formatBytes(bytes, locale?)` are exported for building around the element; `DEFAULT_TAG_NAME` is `'basketball-upload'`.

## License

[ISC](LICENSE). Design credit in [NOTICE.md](NOTICE.md).
