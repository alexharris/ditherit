# Dither it! Design System

Reference for visual language, component usage rules, and design decisions. Also rendered live at `/design-system`.

---

## Colors

### Brand
| Token | Value | Usage |
|-------|-------|-------|
| `--color-ditherit` | `#C53030` | Logo, spinners, drag overlay, resize handles, active swatch rings, primary CTAs |
| `--color-ditherit-tint` | 10% brand red over white (`gray-800` in dark) | Opaque tinted surfaces: subtle primary buttons (`class="bg-ditherit-tint"`), colored cards |

Use `text-ditherit`, `border-ditherit`, `ring-ditherit`, `bg-ditherit` for all brand red. Do not use `red-500` or `red-700` for brand purposes — those are reserved for semantic error states only.

Configured in `app.config.ts` as `ui.colors.primary: 'red'`. The Tailwind red scale is remapped to ditherit values in `app/assets/css/main.css` via a `:root` override, so NuxtUI's `color="primary"` resolves to exact ditherit values. (NuxtUI only accepts built-in Tailwind color names; the `:root` override is how we get the exact shade.)

### Neutral (Gray)
Light mode uses three stops: `gray-100`, `gray-500`, `gray-800`. Dark mode adds `gray-400` (muted text) and `gray-900` (deep backgrounds) for contrast.

| Stop | Hex | Light mode use | Dark mode use |
|------|-----|---------------|--------------|
| `gray-100` | `#F3F4F6` | Light backgrounds, borders | — |
| `gray-400` | `#9CA3AF` | — | Muted text, secondary icons |
| `gray-500` | `#6B7280` | Muted text, secondary icons | Borders |
| `gray-800` | `#1F2937` | Body text | Elevated surfaces (panels, sidebar, toolbar) |
| `gray-900` | `#111827` | — | Main page/app background |

- **App background:** `bg-gray-100 dark:bg-gray-900`
- **Elevated panels:** `bg-white dark:bg-gray-800`
- **Borders:** `border-gray-100 dark:border-gray-800`
- **Body text:** `text-gray-800 dark:text-gray-100`
- **Muted text:** `text-gray-500 dark:text-gray-400`

### Semantic
Success → green, error → red, warning → amber, info → blue. Use NuxtUI's named colors (`color="success"` etc.) on components where possible.

Algorithm badges use custom classes (see Badges section) since they live inside the sidebar rather than as standalone status indicators.

**Tech debt:** Two inline SVG hardcodes (`rgb(239,68,68)`, `rgb(0 0 0 / 0.05)`) should be replaced with Tailwind tokens.

---

## Typography

**Font:** Public Sans (system sans-serif fallback). Defined in `app/assets/css/main.css` via `--font-sans`.

| Role | Size | Weight | Additional |
|------|------|--------|------------|
| Page Title | `text-3xl` | `font-bold` | — |
| Section Header | `text-xl` | `font-semibold` | — |
| Subsection Header | `text-lg` | `font-semibold` | — |
| Body | `text-base` | `font-normal` | `leading-relaxed` for paragraphs |
| Label / Button text | `text-sm` | `font-medium` | — |
| Section Label | `text-xs` | `font-medium` | `uppercase tracking-wide` |
| Caption / metadata | `text-xs` | `font-normal` | — |

---

## Buttons

Always use `UButton`. Never use raw `<button>` except in Netlify forms.

| Use case | `color` | `variant` |
|----------|---------|-----------|
| Primary CTA (download, apply) | `primary` | `solid` |
| Secondary action / nav | `neutral` | `ghost` (active route: `soft`) |
| Destructive | `error` | `ghost` or `soft` |
| Standard outlined | `primary` | `outline` + `class="bg-white dark:bg-gray-800"` |

**Sizes:** `size="sm"` for all toolbar, nav, and secondary buttons. Default (`md`) for standalone CTAs (Download, Subscribe, etc.).

**Emoji in labels:** An emoji prefix in `label` is a standard option for any button — e.g. `label="❤️ Support"`. Use when it adds clarity or warmth.

**Icon-only buttons** must have an accessible label via `aria-label` or tooltip.

---

## Form Controls

| Component | When to use |
|-----------|------------|
| `UInput` | Text, email, number fields |
| `USelect` | Single-option dropdowns |
| `UCheckbox` | Boolean toggles |
| `USlider` | Range values (e.g. pixeliness 1–25) |
| `UInputNumber` | Numeric step inputs (e.g. color count) |
| `UTextarea` | Multi-line text |
| `UColorPicker` | Hex color selection |
| Raw `<input>` / `<textarea>` | **Netlify forms only** — required for Netlify's bot detection |

Error state: `color="error"` on UInput.

---

## Icons

**Primary set:** `i-lucide-*` — all UI icons.
**Brand logos:** `i-simple-icons-*` — GitHub only currently.

| Context | Size class |
|---------|-----------|
| Inline with text | `size-4` |
| Standalone action | `size-5` |
| Section / decorative | `size-6` |
| Hero / empty-state | `size-12` |
| Tight badge / superscript | `size-3` |

---

## Spacing

Base unit: 4px (Tailwind default).

Common patterns:
- **Sidebar sections:** `px-3 py-4`
- **Page container:** `max-w-3xl mx-auto px-6 py-10` (content layout), `max-w-5xl` (blog layout)
- **Vertical stacks:** `space-y-2` (tight), `space-y-4` (standard), `space-y-8` (section gaps)
- **Flex gaps:** `gap-1.5` (label+icon), `gap-2` (comfortable), `gap-3` (spacious)

---

## Borders & Radius

| Use | Border class |
|-----|-------------|
| All borders | `border-gray-100 dark:border-gray-800` |
| Active swatch / focus | `border-[#C53030]` or `ring-2 ring-[#C53030]` |

| Element | Radius |
|---------|--------|
| All panels, cards, custom elements | `rounded-lg` |
| Swatches, circles | `rounded-full` |

`rounded-lg` is the single corner radius for all custom elements. NuxtUI components (UButton, UInput) use `rounded-md` internally — don't override them. Netlify raw form inputs use `rounded-md` to visually match NuxtUI inputs.

**Shadows:** None except NuxtUI component defaults. Do not add custom box shadows.

---

## Cards

Always use `UCard`. Two variants:

**Neutral** (`variant="outline"`, the default) — for content grids like the about page features:
```vue
<UCard :ui="{ body: 'p-3 sm:p-3' }">
  <p class="mb-1 text-sm font-medium text-highlighted">🔒 Title</p>
  <p class="text-sm text-gray-800 dark:text-gray-100">Description</p>
</UCard>
```

**Colored/semantic** (`variant="soft"` + custom background) — for sidebar widgets and contextual callouts:
```vue
<UCard variant="soft" :ui="{ root: 'bg-ditherit-tint', body: 'p-4 sm:p-4' }">
  <p class="text-sm font-medium text-highlighted">📋 Title with emoji</p>
  <p class="text-sm text-gray-800 dark:text-gray-100">Body text</p>
</UCard>
```

| Property | Value |
|----------|-------|
| Border | `variant="soft"` has no ring — background alone provides grouping |
| Title | `text-sm font-medium text-highlighted` + emoji prefix (required on colored cards) |
| Body text | `text-sm text-gray-800 dark:text-gray-100` (full contrast — not muted) |

The emoji is the primary visual differentiator between a colored card title and a plain section label — keep it.

---

## Dark Mode

All components must include `dark:` variants. Dark mode is toggled via `useColorMode()` and persisted. Pattern:

```html
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
```

---

## Motion

No custom animations. Use:
- `transition-colors` for color/background transitions
- `hover:text-gray-800 dark:hover:text-gray-200` — standard hover text
- `hover:bg-gray-100 dark:hover:bg-gray-800` — standard hover background
- NuxtUI handles all component-level transitions internally

---

## Layout Structure

```
┌─ AppHeader (fixed mobile / relative desktop) ────────────────┐
│  logo | nav links | dark mode toggle | mobile menu button     │
└───────────────────────────────────────────────────────────────┘
┌─ sidebar (w-64, hidden on mobile) ──┐ ┌─ main content ───────┐
│  SidebarDitherMode                  │ │  ImageCompare         │
│  SidebarPalette                     │ │  ImageThumbnailStrip  │
│  SidebarPixelScale                  │ │  FileSizeReport       │
│  SidebarFeedback                    │ │                       │
└─────────────────────────────────────┘ └───────────────────────┘
```

Mobile: sidebar becomes a `USlideover` (right side drawer).

Content pages use `layouts/content.vue` (`max-w-3xl`).
Blog pages use `layouts/blog.vue` (`max-w-5xl` + sidebar).
