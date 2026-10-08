# @sehv-oss/basketball-upload

## 1.0.1

### Patch Changes

- 2060e49: Setting `--basketball-upload-accent` also recolors its shades: the bracket and the back of the rim (`accent-strong`) and the dropzone under a drag (`accent-surface`) are mixed from it, instead of staying orange. Without a custom accent, the colors of the design are unchanged.
- 6df7084: Cards dropped on the court fly in from under the pointer. Their entrance used to be offset by the rotation of the card, by up to about 100 px for the cards under the top one.
- 6df7084: The element is now its own stacking context: the layers of the hoop (the card layer, the front of the rim and net, the "+1") no longer paint over page content with a lower `z-index`, such as menus or sticky bars.

## 1.0.0

### Major Changes

- d5fe90d: First release: the `<basketball-upload>` Web Component — drag and drop, or take the shot — and its React 19 component. A faithful implementation of Jorge Molina's basketball upload design.
