# Minimal Schematic Renderer Modal Demo

This is a **standalone demo** for testing a modal-based 3D preview flow.

## Files

- `SchematicRendererDemoModal.tsx`: Modal + canvas + dynamic import from npm packages
- `SchematicRendererDemoLauncher.tsx`: Tiny host component that fetches the schematic binary from your existing API and opens the modal
- `schematic-renderer-demo-modal.scss`: Minimal styles (BEM classes)

## Setup

Install dependencies:

```bash
npm install three schematic-renderer
```

For full block rendering, add a vanilla resource pack zip at:

- `/public/vendor/vanilla-resource-pack.zip`

Without a resource pack, some schematics may show block entities only (e.g. chests/signs) while regular block meshes are missing.

The demo uses dynamic imports, so packages are only loaded when the modal opens (lazy loading).

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
- The upstream library's README has known API issues (see https://github.com/Schem-at/schematic-renderer/issues). This demo works around them.
- Upstream license for `schematic-renderer` is AGPL-3.0. Confirm legal compatibility before production use.
