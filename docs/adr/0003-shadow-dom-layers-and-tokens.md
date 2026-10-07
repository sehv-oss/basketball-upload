# ADR 0003 — Shadow DOM, cascade layers and tokens

**Status:** accepted

## Context

The element sits inside applications with arbitrary global CSS. It must reproduce the reference design exactly, adapt to light and dark color schemes, and stay customizable without making its DOM tree an API. It is also drawn in layers that interleave: a flying card passes in front of the backboard and the back of the rim, but behind the front of the rim and the net.

## Decision

An open Shadow DOM with one constructed `CSSStyleSheet`, shared by all instances and created on first use; consumers import no CSS. Its sources are plain `.css` files, concatenated in cascade order:

```text
@layer tokens, reset, layout, components, states, motion;
```

- **tokens**: every public `--basketball-upload-*` token is read once on `:host` into a private `--_*` variable, with the default as fallback. Internal rules only use private variables, so a token set on the element or any ancestor wins. Primitive colors are the ones measured on the reference screenshots, paired with dark values in `light-dark()`; `color-scheme` on the host (`light dark`, or the `theme` attribute) picks the pair.
- **layout**: the host is a container (`container-type: inline-size`); sizes derive from `cqi`, so the hoop and the gutter follow the element's width. Container containment also makes the host the stacking context in which the hoop layers (dropzone 0, back of the rim 1, card layer 2, front of the rim and net 3, "+1" 4) interleave — which is why `.frame` and `.hoop` must never create a stacking context of their own.
- **states**: `ElementInternals.states` exposes `dragging`, `drop-target`, `aiming`, `flying`, `scoring`, `rejected` and `disabled`, styled internally with `:host(:state(…))` and available to consumers as `basketball-upload:state(…)`.
- **motion**: keyframes and `prefers-reduced-motion` overrides, last.

Outside, the compatibility surface is: tokens, parts (`::part(dropzone)`, `::part(file-pdf)`, …), states and slots.

## Consequences

- The internal DOM can change freely; tokens, parts and states are public API.
- No per-theme stylesheets: each token is declared once.
- Setting the accent recolors its shades (`accent-strong`, `accent-surface`), while the defaults stay the measured colors: the mixes reference `--basketball-upload-accent` without a fallback, so they are invalid, and skipped, until it is set.
- Requires custom states, `light-dark()`, nesting, cascade layers and container queries: browsers since mid 2024.
- `@property` is not used: registered properties are ignored inside shadow trees. Progress bars animate `scale` instead.
- Styles of the page never reach inside; custom artworks (ADR 0007) style themselves.
