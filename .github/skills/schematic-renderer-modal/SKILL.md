---
name: schematic-renderer-modal
description: stabilize and debug the 3d schematic preview modal using schematic-renderer. use for missing BlockEntities errors, resource-pack reload churn, and preview flicker/regressions.
---

Default mode: strict.

Use this skill when user asks for:

- failing schematic preview modal
- parser error: Missing tag "BlockEntities"
- repeated resource-pack reload/log spam
- preview flicker, camera stutter, or hover-related instability

Primary file:

- src/components/schematicRendererModal/SchematicRendererModal.tsx

Rules:

- Keep init one-time per open cycle (guard ref) to avoid duplicate renderer setup.
- Keep stage-based logging with run id for root-cause tracing.
- Retry schematic load once only after in-memory repair.
- For repair path, patch decoded NBT in memory and inject both BlockEntities and TileEntities as empty COMPOUND lists on reachable compounds.
- Do not block retry on brittle post-write shape verification; if write succeeds, try retry.
- Keep preview stability profile: adaptive FPS off, post-processing off.
- Disable highlight behavior with a truthy no-op highlight manager (not null) to preserve render loop.

Resource-pack guidance:

- Wait briefly for auto-restored enabled packs before fallback pack load.
- If enabled pack exists, reuse it.
- If no enabled pack, enable existing local-vanilla pack by id before loading blob.
- If mutation required, keep auto rebuild disabled and perform one explicit atlas rebuild.

Noise policy:

- Ignore non-blocking warnings (e.g., THREE.Clock deprecation, FFmpeg missing) unless user asks to clean all logs.

Done checklist:

1. Build passes.
2. Preview opens for known failing schematic.
3. No repeated fallback local-vanilla load loops.
4. Error message includes exact failed stage if still failing.
