# dnd-basketball

Drag and drop, or take the shot.

A file upload where the dropzone is a backboard. Drop your files on it, or pull a file back like a slingshot and score it into the basket: the dots show exactly where it is going. Every file that goes in is uploaded, with its progress in the list below.

**[Live demo](https://sehv-oss.github.io/dnd-basketball/)**

<img src="docs/images/preview.png" alt="The element: a dropzone shaped like a backboard, a rim and net below it, and a PDF card pulled back with dotted aiming arc towards the hoop" width="377" />

## Credits

Design by **Jorge Molina** — [jm-fuster](https://github.com/jm-fuster) on GitHub, [@jm_fuster](https://www.figma.com/@jm_fuster) on Figma Community, [jorgemolinafuster.com](https://jorgemolinafuster.com).

This project is an independent, faithful code implementation of his basketball upload design, published on Figma Community. It is not affiliated with or endorsed by the author. See [NOTICE.md](NOTICE.md) for what was added along the way.

## Packages

| Package                                            | What                                                   |
| -------------------------------------------------- | ------------------------------------------------------ |
| [`@sehv-oss/dnd-basketball`](packages/core)        | The `<dnd-basketball>` Web Component, for any stack    |
| [`@sehv-oss/dnd-basketball-react`](packages/react) | `<DndBasketball>`, a thin React 19 component around it |

### Web Component

```bash
npm install @sehv-oss/dnd-basketball
```

```html
<dnd-basketball multiple accept="image/*,.pdf"></dnd-basketball>

<script type="module">
  import {
    registerDndBasketball,
    createXhrUploader,
  } from '@sehv-oss/dnd-basketball';

  registerDndBasketball();
  document.querySelector('dnd-basketball').uploader = createXhrUploader({
    url: '/api/uploads',
  });
</script>
```

### React

```bash
npm install @sehv-oss/dnd-basketball-react
```

```tsx
import {
  DndBasketball,
  createXhrUploader,
} from '@sehv-oss/dnd-basketball-react';

const uploader = createXhrUploader({ url: '/api/uploads' });

export function Uploads() {
  return <DndBasketball multiple accept="image/*,.pdf" uploader={uploader} />;
}
```

The [core README](packages/core/README.md) documents the whole API: attributes, events, theming tokens, parts, file types, uploads and forms.

## Development

Requires Node.js 26 (`.nvmrc`) and pnpm through Corepack.

```bash
corepack enable
pnpm install
pnpm site:dev        # the demo site, running the packages from their sources
pnpm build           # type checks, builds both packages, then the site
pnpm test:setup      # once: the Chromium used by the browser tests
pnpm test            # unit tests (Node) and element/React tests (Chromium)
pnpm lint            # cspell and prettier
```

The site serves the element alone, at the size of the reference design, at `/dnd-basketball/?reference`: compare it with the screenshots in [`docs/design/reference`](docs/design/reference).

Architecture decisions are recorded in [`docs/adr`](docs/adr).

## License

[ISC](LICENSE)
