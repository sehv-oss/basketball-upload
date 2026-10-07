# @sehv-oss/basketball-upload-react

React 19 component for [`<basketball-upload>`](../core): drag and drop, or take the shot.

`<BasketballUpload>` renders the Web Component; it is not a second implementation. Everything about the element — how files get in, uploads, forms, file types and theming — is documented in the [core README](../core/README.md).

**[Live demo](https://sehv-oss.github.io/basketball-upload/)**

Design by **Jorge Molina** ([jm-fuster](https://github.com/jm-fuster), [@jm_fuster](https://www.figma.com/@jm_fuster) on Figma Community). See [NOTICE.md](NOTICE.md).

## Installation

```bash
# npm
npm install @sehv-oss/basketball-upload-react

# pnpm
pnpm add @sehv-oss/basketball-upload-react

# yarn
yarn add @sehv-oss/basketball-upload-react
```

`react` 19 or newer is a peer dependency. The element comes along as a dependency.

## Usage

```tsx
import {
  BasketballUpload,
  createXhrUploader,
  type BasketballUploadElement,
  type BasketballUploadProps,
} from '@sehv-oss/basketball-upload-react';
import * as React from 'react';

// Stable across renders: module scope, useMemo or useCallback.
const uploader = createXhrUploader({ url: '/api/uploads' });

export function Uploads() {
  const hoop = React.useRef<BasketballUploadElement>(null);

  const handleOnShot: BasketballUploadProps['onShot'] = ({ file, result }) =>
    console.log(file.name, result);
  const handleOnUploadSuccess: BasketballUploadProps['onUploadSuccess'] = ({
    item,
  }) => console.log('stored', item.response);
  const handleOnClick = () => hoop.current?.clear();

  return (
    <>
      <BasketballUpload
        ref={hoop}
        multiple
        accept="image/*,.pdf"
        maxSize={20_000_000}
        uploader={uploader}
        onShot={handleOnShot}
        onUploadSuccess={handleOnUploadSuccess}
      >
        <span slot="hint">PDF or images, up to 20 MB</span>
      </BasketballUpload>

      <button onClick={handleOnClick}>Clear</button>
    </>
  );
}
```

The component registers the element itself (`tagName` when it was registered under another name). The module starts with `'use client'`, for React Server Components frameworks such as Next.js.

## Props

| Prop                                                                                                           | Element API                            |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `theme`, `accept`, `multiple`, `maxSize`, `maxFiles`, `name`, `required`, `disabled`, `instant`, `concurrency` | attributes, rendered on the server too |
| `uploader`, `messages`, `fileTypes`                                                                            | properties, applied after mount        |
| `onFileReject`, `onShot`, `onUploadStart`, `onUploadProgress`, `onUploadSuccess`, `onUploadError`, `onChange`  | events; the callback gets the `detail` |
| `ref`                                                                                                          | the `<basketball-upload>` element      |
| `children`                                                                                                     | slotted content (`slot="title"`, …)    |
| `id`, `className`, `style`, `tagName`                                                                          | the host element                       |

Keep `uploader`, `messages` and `fileTypes` stable (module scope, `useMemo`, `useCallback`): a new value is assigned to the element on every change. Callbacks can change freely.

For forms, render it inside a `<form>` with a `name`, as you would an `<input type="file">`; with React 19 actions, the files arrive in the `FormData`.

The helpers and types needed to use the component are re-exported from the core: `createXhrUploader`, `UploadError`, `registerFileType`, `defaultMessages`, `defaultFileTypes`, and the types of the element, its props and events (`BasketballUploadElement`, `Uploader`, `UploadItem`, `FileType`, `Messages`, …). The ones for building around the element (`resolveFileType`, `matchesAccept`, `formatBytes`, `registerBasketballUpload`) come from [`@sehv-oss/basketball-upload`](../core).

## License

[ISC](LICENSE). Design credit in [NOTICE.md](NOTICE.md).
