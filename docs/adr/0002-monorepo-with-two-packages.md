# ADR 0002 — A monorepo with two packages and a site

**Status:** accepted

## Context

`sehv-oss/pdf-viewer` ships its layers as subpath exports of a single package (its ADR 0003). Here the request was explicit: a core package with the Web Component, and a separate package with the React wrapper. `sehv-oss/i18n` already has that shape — `packages/core`, `packages/react` and a demo `site/` in one pnpm workspace.

## Decision

A pnpm workspace in the layout of `sehv-oss/i18n`:

```text
packages/core   @sehv-oss/basketball-upload         the element; no dependencies
packages/react  @sehv-oss/basketball-upload-react   depends on the core (workspace:^), peer react >=19
site            @sehv-oss/basketball-upload-site    private demo, deployed to GitHub Pages
```

Versions shared by the workspace live in the pnpm `catalog:` of `pnpm-workspace.yaml`. Changesets versions and publishes both packages and ignores the site. `pnpm --recursive build` builds them in dependency order: core, react, then the site, which consumes their `dist/`.

## Consequences

- React users install one package; the element comes along. Users of anything else never download React bindings.
- Each package has its own version and changelog; `updateInternalDependencies` bumps the React package when the core changes.
- The React package type checks against the core's published declarations, so `pnpm build` must build the core first (it does).
- Each package directory carries its own `LICENSE` and `NOTICE.md`, since npm only packs files inside it.
