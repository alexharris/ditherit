# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dither it! is a client-side image dithering web application built with Nuxt 4 (Vue 3). Users upload images, apply dithering algorithms with customizable palettes, and download results. All image processing happens in the browser using the Canvas API — there is no backend or external API.

## Commands

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm generate     # Static site generation
pnpm preview      # Preview production build
pnpm lint         # ESLint
pnpm typecheck    # Vue TSC type checking
```

CI runs lint and typecheck on every push (Node 22, pnpm).

## Architecture

**SPA mode** — `ssr: false` in nuxt.config.ts. No server-side rendering.

### Core Processing Pipeline

1. Images uploaded via drag-and-drop or file picker → managed by `useImageGallery` composable
2. Selected image analyzed for palette via `useDithering.analyzePalette()` (uses the selected algorithm in `app/utils/palette-analysis.ts`)
3. User configures settings in sidebar (mode, algorithm, colors, palette, pixeliness)
4. Dithering applied via one of two paths:
   - **Error diffusion** (`ditherMode: 'diffusion'`): `kernelDiffusionDither()` in `app/utils/dithering.ts` with 11 kernels (Floyd-Steinberg, Atkinson, Stucki, etc.), in RGB or OKLab
   - **Bayer ordered** (`ditherMode: 'bayer'`): Custom implementation in `app/utils/dithering.ts` using 4x4 threshold map
5. Results rendered to canvas, converted to PNG data URL for display/download

### Key Composables (state management, no Pinia)

- **`useDithering`** — Dithering engine: mode, algorithm, color count, serpentine, pixeliness, palette. Dispatches to the dither functions in `app/utils/dithering.ts` (or the Web Worker).
- **`usePalette`** — 16 preset palettes + custom palette CRUD. Persistence via localStorage key `ditherit_custom_palettes`.
- **`useImageGallery`** — Multi-image management with lazy processing. Bulk ZIP download via JSZip.

### Key Components

- **`PaletteEditor`** — Color swatch grid, inline picker, preset selector, save/export/import
- **`ImageCompare`** — Wraps `img-comparison-slider` web component (registered as custom element in nuxt.config.ts)
- **`FileSizeReport`** — SVG donut chart comparing original vs dithered file size

### Utilities (`app/utils/dithering.ts`)

- `bayerDither()` — Ordered dithering with 4x4 Bayer matrix
- `kernelDiffusionDither()` — Error diffusion (all kernels, RGB/OKLab). Carried error must stay bounded — RGB clamps to 0–255, OKLab caps error at `OKLAB_MAX_ERROR` — or out-of-gamut regions bleed wrong-color blobs
- `knollPatternDither()` — Thomas Knoll's pattern dithering (`ditherMode: 'pattern'`): ordered dithering for irregular palettes. Builds a luminance-sorted "mixing plan" per color in linear light; the Bayer or blue-noise threshold picks the entry. Plans are cached per 6-bit color
- `addPixelation()` — Block-size pixelation effect via canvas downscale/upscale
- `getClosestColor()` — Euclidean distance color matching

### Palette Analysis (`app/utils/palette-analysis.ts`)

Picks the "Original (from image)" palette. The image is downscaled and bucketed into a color histogram once, then handed to one of the algorithms in `PALETTE_ALGORITHMS` (K-means in OKLab, median cut, popularity). To add an algorithm, write a `PaletteQuantizer` (`(bins, count) => number[][]`) and add an entry to `PALETTE_ALGORITHMS` — the UI selector, deduplication and dark→light sorting come for free.

## Important Dependencies

- **img-comparison-slider** — Web component, not a Vue component. Registered via `vue.compilerOptions.isCustomElement` in nuxt.config.ts.

## Code Style

- ESLint with Nuxt preset, stylistic rules: `commaDangle: 'never'`, `braceStyle: '1tbs'`
- TypeScript throughout
- 2-space indent, LF line endings (see .editorconfig)
- Tailwind CSS v4 with NuxtUI v4

## Git Conventions

Do not mention Claude or Anthropic in commit messages. Omit the `Co-Authored-By` trailer.

## Design System

`DESIGN-SYSTEM.md` documents the visual language for this project — colors, typography, buttons, cards, spacing, borders, and more. The live reference is at `/design-system`.

**When implementing new UI features:** check `DESIGN-SYSTEM.md` first and follow established patterns (button variants, card structure, gray scale, radius, etc.).

**When introducing new patterns:** update both `DESIGN-SYSTEM.md` and `app/pages/design-system.vue` to keep the reference current.

## Feature Tracking

See `MISSING-FEATURES.md` for the checklist of features from the original version that still need implementation (examples gallery, help tooltips, resources page, etc.).
