---
name: scss-bem-styling
description: enforce project styling conventions: use colors from src/global/colors.scss, keep styles in separate .scss files, and use BEM naming with SCSS nesting.
---

Default mode: strict.

Apply this skill when user asks for UI styling, CSS/SCSS updates, component styling, layout polish, or visual refactors.

Core rules:

- Always use variables from `src/global/colors.scss` for color values.
- Avoid hardcoded hex/rgb/hsl colors unless adding a new design token to `src/global/colors.scss` is explicitly required.
- Keep styles in separate `.scss` files (no inline styles, no large style blocks inside TSX files).
- Use BEM class naming:
- Block: `.component-name`
- Element: `&__element`
- Modifier: `&--modifier`
- Prefer SCSS nesting for BEM structure; keep nesting shallow and readable.
- One component/page should map to one primary SCSS file when practical.
- Prefer descriptive class names tied to semantics, not visual hacks.
- Border radius should be compact by default.
- Prefer one step smaller radius across UI primitives (`sm` over `md` in Mantine) unless UX explicitly needs larger rounding.

File and import patterns:

- For a component file `Widget.tsx`, prefer sibling style file `Widget.scss`.
- Import style at top of the component/page entry file.
- If a shared SCSS partial is needed, use leading underscore naming and import from consuming SCSS file.

Color token policy:

- Allowed: `var(--background)`, `var(--highlight)`, etc.
- If a needed tone is missing, add a new token in `src/global/colors.scss` with a semantic name.
- Do not create one-off near-duplicate colors.

BEM + nesting example:

```scss
.widget {
  background: var(--background-emphasis);
  border: 1px solid var(--borders);
  color: var(--white);

  &__title {
    color: var(--highlight);
  }

  &__button {
    background: var(--highlight);

    &:hover {
      background: var(--highlight-hover);
    }

    &--danger {
      background: var(--danger);

      &:hover {
        background: var(--danger-hover);
      }
    }
  }
}
```

Do not apply this skill when:

- task is unrelated to UI styles
- user explicitly requests CSS-in-JS or another styling system
- existing file is constrained by external library styles that must remain untouched
