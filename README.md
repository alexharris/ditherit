# Dither it!

A client-side image dithering web app. Upload images, apply dithering algorithms with customizable palettes, and download the results. All processing happens in the browser — no server, no uploads, no tracking.

## Features

- **Two dithering modes** — Error diffusion (11 algorithms including Floyd-Steinberg, Atkinson, Stucki) and Bayer ordered dithering
- **Customizable palettes** — 16 presets (Gameboy, CMYK, monochrome, etc.) plus full custom palette editing
- **Adjustable color count** — Control how many colors appear in the output
- **Pixeliness control** — Block-size pixelation effect
- **Before/after comparison** — Interactive slider to compare original and dithered images
- **Batch processing** — Upload multiple images, process them all, bulk download as ZIP
- **File size reporting** — See how dithered images compare to originals
- **Save & share palettes** — Save custom palettes to localStorage, export/import as JSON
- **Dark mode** — Automatic or manual

## Tech Stack

- [Nuxt 4](https://nuxt.com) (Vue 3, SPA mode)
- [Nuxt UI v4](https://ui.nuxt.com) + [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript
- Web Workers for off-main-thread dithering
- Canvas API for image processing

## Development

```bash
pnpm install
pnpm dev
```

Runs at `http://localhost:3000`.

## Build

```bash
pnpm build       # Production build
pnpm generate    # Static site generation
pnpm preview     # Preview production build
```

## Linting & Type Checking

```bash
pnpm lint
pnpm typecheck
```

## License

MIT
