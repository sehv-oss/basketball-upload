---
'@sehv-oss/basketball-upload': patch
---

The element is now its own stacking context: the layers of the hoop (the card layer, the front of the rim and net, the "+1") no longer paint over page content with a lower `z-index`, such as menus or sticky bars.
