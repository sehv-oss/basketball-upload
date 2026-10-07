# AGENTS.md

Guidance for coding agents working in this repository. The [README](README.md) covers what the project is; this file covers how to work on it.

## Layout

```text
packages/core    @sehv-oss/basketball-upload        the <basketball-upload> Web Component; no dependencies
packages/react   @sehv-oss/basketball-upload-react  <BasketballUpload>, a thin React 19 component around it
site             @sehv-oss/basketball-upload-site   private demo, deployed to GitHub Pages
docs/adr         architecture decision records
docs/design      screenshots of the reference design
```

Each package has a single entry point, named after the package (never `index.ts`), and everything public is re-exported from it: `packages/core/src/basketball-upload.ts` and `packages/react/src/basketball-upload-react.ts`.

In the core, `game/`, `upload/` and `file-types/` are pure: they never touch the DOM and are tested in Node. Only `element/` does.

The layout follows `sehv-oss/i18n`, and the Web Component patterns (`cssText()`, SSR-safe registration, token pipeline, React adapter).

## Commands

Node.js 26 (`.nvmrc`) and pnpm through Corepack.

```bash
pnpm install
pnpm site:dev        # the demo site, running the packages from their sources
pnpm build           # type checks sources and tests, builds both packages, then the site
pnpm test:setup      # once: the Chromium used by the browser tests
pnpm test            # unit tests (Node) and element/React tests (Chromium)
pnpm lint            # cspell and prettier
```

Before calling a change done, run `pnpm lint`, `pnpm build` and `pnpm test`.

## Architecture

The ADRs in [`docs/adr`](docs/adr) are the reference. Read the one for the area before changing it:

| Area                         | ADR                                                                                        | Constraints that are easy to break                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Element API, React adapter   | [0001](docs/adr/0001-web-component-as-primary-ui.md)                                       | Adapters hold no logic, state or rendering. The element module imports without a DOM. Members never shadow `HTMLElement` (`removeItem`, `messages`).           |
| Workspace, build, dev server | [0002](docs/adr/0002-monorepo-with-two-packages.md), [0006](docs/adr/0006-tsdown-build.md) | `.css` files are imported as strings and reach the Shadow DOM verbatim. The site and the tests run from `src/`; the deployed site runs `dist/`.                |
| CSS and theming              | [0003](docs/adr/0003-shadow-dom-layers-and-tokens.md)                                      | Rules use only private `--_*` variables. Tokens, parts, states and slots are public API. `.frame` and `.hoop` never create a stacking context. No `@property`. |
| Shot physics                 | [0004](docs/adr/0004-deterministic-shot-simulation.md)                                     | Preview and flight run the same `step()`. Constants are calibrated on the reference screenshots.                                                               |
| Uploads and forms            | [0005](docs/adr/0005-uploader-and-form-association.md)                                     | The element owns no transport: it calls the `uploader` function.                                                                                               |
| File types                   | [0007](docs/adr/0007-file-type-registry.md)                                                | Labels and file names are text, never HTML.                                                                                                                    |

## Conventions

- **File names in `src/` and `tests/` are kebab-case.** Classes keep PascalCase names inside them: `UploadQueue` lives in `upload-queue.ts`. Suffixes after a dot are fine: `.d.ts`, `.fixture.ts`, and the test suffixes below.
- Relative imports carry the `.ts` extension.
- Named exports only. Default exports are for configuration files.
- React is imported as a namespace, `import * as React from 'react'`, and used as `React.useRef` or `React.ReactNode`; a file that only uses its types writes `import type * as React from 'react'`. React DOM too: `import * as ReactDOM from 'react-dom/client'` and `import * as ReactDOMServer from 'react-dom/server'`.
- React callbacks are consts named `handle` plus the prop, declared before the JSX, never inline functions: `const handleOnShot = …` then `onShot={handleOnShot}`. When a component has several handlers for the same event, the subject goes before the event, as in a prop name: `handleOnInstantChange`, `handleOnClearClick`. In a `.map()`, the handler is declared in the callback body. A state setter is passed as it is (`onChange={setTheme}`). The callbacks of `<BasketballUpload>` take their type from its props: `const handleOnShot: BasketballUploadProps['onShot'] = ({ file }) => …`.
- The TypeScript presets (`@sehv-oss/typescript-config`) enable `erasableSyntaxOnly` (no `enum`, `namespace` or parameter properties), `verbatimModuleSyntax` (type-only imports say `type`) and `exactOptionalPropertyTypes` (an optional prop that accepts `undefined` declares `| undefined`).
- Visible copy and accessible names come from `Messages` (`element/messages.ts`); views never hard-code text.
- Shared dependency versions live in the `catalog:` of `pnpm-workspace.yaml`; a `package.json` refers to them as `catalog:`. pnpm 11 holds back releases that are too recent: pick the newest version it accepts, without adding a `minimumReleaseAgeExclude`. The pnpm version matches the rest of the organization; changing it is an organization-wide decision.
- No ESLint: the organization has no config for it. Formatting is Prettier, spelling is cspell; words cspell does not know go in `.cspell.config.ts`.

## Tests

Tests live in each package's `tests/`, mirror the layout of `src/`, import from `vitest` explicitly and exercise the sources (`../../src/...`), never `dist/`. The suffix picks the environment:

| Suffix                      | Runs in  |
| --------------------------- | -------- |
| `core/**/*.test.ts`         | Node     |
| `core/**/*.browser.test.ts` | Chromium |
| `react/**/*.test.tsx`       | Chromium |
| `react/**/*.ssr.test.tsx`   | Node     |

## Changes

- Commit messages and PR titles follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`…). PRs are squash merged, so the PR title becomes the commit message.
- A change that affects a published package needs a changeset (`pnpm changeset`). The site is ignored by changesets.
- A change to the API or behavior of the element updates [`packages/core/README.md`](packages/core/README.md), which documents the whole API. A new attribute, property or event also goes in the props table of the [React README](packages/react/README.md).
- A decision that shapes the packages gets a new ADR in `docs/adr`, listed in its README.
- Visual changes are compared with the screenshots in [`docs/design/reference`](docs/design/reference), at `/basketball-upload/?reference` on the dev site, in both themes and with reduced motion.
- The design is by Jorge Molina, and crediting him is a requirement: the READMEs, the `NOTICE.md` files, `docs/design/reference/README.md` and the site's credits keep the credit. `NOTICE.md` exists at the root and in each package, with the same content: keep the three in sync.
