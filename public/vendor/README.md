# Vendor Files For Schematic Demo

Drop runtime UMD bundles here when external network/CDN is blocked.

Required files:

- `three.min.js`
- `schematic-renderer.umd.js`

The demo modal at `Examples/demo/schematic-renderer/SchematicRendererDemoModal.tsx`
loads these first before trying external CDNs.
