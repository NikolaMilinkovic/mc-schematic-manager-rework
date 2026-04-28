# Minimal Schematic Renderer Modal Demo

This is a **standalone demo** for testing a modal-based 3D preview flow without adding renderer deps to app code.

## Files

- `SchematicRendererDemoModal.tsx`: Modal + canvas + runtime script loading (vendor-first, then CDN fallback)
- `SchematicRendererDemoLauncher.tsx`: Tiny host component that fetches the schematic binary from your existing API and opens the modal
- `schematic-renderer-demo-modal.scss`: Minimal styles (BEM classes)

## Runtime loading order

The demo tries script sources in this order:

1. Local files served by Vite:

- `/vendor/three.min.js`
- `/vendor/schematic-renderer.umd.js`

2. External CDN fallback:

- unpkg
- jsDelivr

This allows use in restricted workplace networks when CDN access is blocked.

## If your network blocks npm/CDN

Place these files manually in `public/vendor/`:

- `three.min.js`
- `schematic-renderer.umd.js`

Then rerun app; modal will load local files first.

## Quick wiring example (temporary)

Use this in any page/component where you already have `schematic._id` and `schematic.name`:

```tsx
import SchematicRendererDemoLauncher from "../../Examples/demo/schematic-renderer/SchematicRendererDemoLauncher";

<SchematicRendererDemoLauncher
  schematicId={schematic._id}
  schematicName={schematic.name}
/>;
```

## Notes

- Keep this as demo-only code for now.
- If you move this into production code later, prefer npm install and explicit typings.
- Upstream license for `schematic-renderer` is AGPL-3.0. Confirm legal compatibility before production use.
