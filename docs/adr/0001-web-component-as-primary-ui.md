# ADR 0001 — Web Component as the primary UI

**Status:** accepted

## Context

The upload has to serve React applications today and any other stack later, with one visual implementation: the design is detailed (layered hoop, physics, animations) and keeping two renderings faithful to it would double the work and let them drift.

## Decision

`<basketball-upload>` (`BasketballUploadElement`) is the reference implementation, following `sehv-oss/pdf-viewer` (its ADR 0001). Framework packages are adapters that translate the element's attributes, properties and events into the idiom of the framework; they contain no upload logic, no state and no rendering of their own.

The React adapter targets React 19, which assigns props to custom elements as properties on the client and as attributes on the server, and takes `ref` as a plain prop. Plain values are passed under their attribute names (`max-size`), so the server renders them and the client upgrades the element with them; functions and objects (`uploader`, `messages`, `fileTypes`) are assigned in layout effects, and event callbacks are bound with `addEventListener` through a ref to the latest callbacks.

## Consequences

- One hoop, one physics, one event model, one theming API. Fixes and features land once.
- The element's API is attributes, properties, methods, bubbling `CustomEvent`s, slots, parts and states — nothing framework-specific.
- Registration is explicit (`registerBasketballUpload()`), and adapters call it; importing a package has no side effects.
- The element module must be importable without a DOM: it extends a stand-in when `HTMLElement` is missing, and creates its stylesheet lazily.
- Methods must not collide with `HTMLElement`: the item methods are `retryItem` and `removeItem` (a `remove(id)` would shadow `Element.remove()`), and the copy is `messages` (form controls conventionally expose `labels` as their `<label>` elements).
