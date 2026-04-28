---
name: global-animations
description: enforce reusable motion patterns from src/global/animations.scss. use when adding hover/focus transitions, page-enter effects, reduced-motion handling, or asking where shared animations should live.
---

Default mode: strict.

Use this skill when user asks for:

- reusable UI animation patterns
- consistent hover/transition behavior across components
- where to place shared animation code
- adding or updating global motion helpers

Source of truth:

- `src/global/animations.scss` is the global animation registry.
- Put reusable keyframes, mixins, timing tokens, and utility classes there.
- Component SCSS files should consume global helpers via `@use` and `@include`.

Current shared animation API in `src/global/animations.scss`:

- Keyframes: `page-fade-in`
- Utility classes: `.page-fade-in`, `.page-scroll-lock`
- Tokens: `$ui-interactive-transition-duration`, `$ui-interactive-transition-easing`, `$ui-card-hover-transition-duration`, `$ui-card-hover-transition-easing`
- Mixins: `interactive-hover-transition($duration, $easing)`, `interactive-card-hover-transition($duration, $easing)`

Rules:

- Prefer extending global helpers over copy/paste transitions.
- Keep durations/easing centralized with SCSS variables.
- Always include reduced-motion behavior for reusable animations.
- Keep names semantic and stable; avoid component-specific naming in global file.
- If animation is single-use and tightly coupled to one component, keep local.

Usage example:

```scss
@use "../../global/animations.scss" as animations;

.my-button {
  @include animations.interactive-hover-transition();
}
```

Update protocol when adding a new global animation helper:

1. Add helper in `src/global/animations.scss`.
2. Add reduced-motion handling if motion is non-essential.
3. Add the helper to the "Current shared animation API" list in this skill file.
4. Replace duplicated local transitions where practical.
