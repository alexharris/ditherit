# Missing Features: v3 vs Original

This document tracks features from the original ditherit that need to be implemented in v3.

## Critical (Must Have)

### Palette Editing
- [x] Inline color picker for individual color editing
- [x] Add/remove colors dynamically
- [x] Preset palettes (Gameboy, CMYK, Red Mono, Green Mono, Blue Mono, Monochrome, Red, Green, Blue)
- [x] Save custom palettes to localStorage
- [x] Delete saved custom palettes
- [x] Export palette to JSON
- [x] Import palette from JSON

### Image Resizing
- [x] Custom width input (max 5000px)
- [x] Auto-calculated height maintaining aspect ratio
- [x] Reset to original dimensions button
- [x] Width validation feedback

### File Size Reporting
- [x] Display original file size
- [x] Display dithered file size
- [x] Show percentage of original
- [x] Donut chart visualization

### Multiple Image Support
- [x] Upload multiple images at once
- [x] Process images on selection (lazy)
- [x] Display multiple results in thumbnail strip
- [x] Bulk download as ZIP (processes unprocessed images first)

### Image Comparison
- [x] Side-by-side comparison slider (img-comparison-slider)
- [x] Toggle between original and dithered views
- [x] Full width toggle when viewing original

---

## High Priority (Should Have)

### Examples Gallery
- [ ] Showcase example images (frog, earth)
- [x] Before/after comparison slider (img-comparison-slider) - component ready
- [ ] Examples for different dither modes
- [ ] Examples for different palettes

### Help System
- [x] Contextual help tooltips for controls
- [x] Explanations for Dither Mode, Image Size and palette features (current tooltips are sufficient)

### Resources Page
- [x] `/resources` route
- [x] Curated list of dithering resources
- [x] Links to tools, articles, tutorials

---

## Medium Priority (Nice to Have)

### Updates/Changelog Section
- [x] Display recent updates
- [x] Feature announcements with timestamps
- [x] Scrollable changelog (covered by the blog)

### Contact Form
- [x] Email widget integration (Netlify Forms, app-wide `ContactModal`)
- [x] Bug report submission (with optional debug info attachment)
- [x] Feature request submission

### Donation Support
- [x] Ko-fi button or similar (header and footer links go to ko-fi.com/alexharris6)
- [x] Support link in footer (and header)

### GIF Export
- [ ] Reduce flicker: keep a pixel's previous dithered color when its source color barely changed (e.g. within ±8 per channel) since that pixel was last updated. Comparing against the last-updated source, not the previous frame, stops slow fades from freezing. Noisy source GIFs flicker in every mode — measured with ±3 source noise: Floyd-Steinberg ~42% of pixels flip per frame, Knoll ~4.5%, Bayer ~1.4%. Also shrinks GIF file size.
- [ ] Suggest an ordered mode (Bayer, Knoll, Blue Noise) when a GIF is loaded with Error Diffusion selected — error diffusion flickers most between frames.

### Color Selection Methods
- [ ] Add Wu's quantizer to `PALETTE_ALGORITHMS` (`app/utils/palette-analysis.ts`) — high quality and fast. Other candidates: octree, NeuQuant.

### Blog
- [x] `/blog` route (replaces the original `/quant` page)
- [x] Update posts via Nuxt Content

---

## Low Priority (Polish)

### Branding
- [x] Custom logo component
- [x] Favicon updates
- [ ] OG image for social sharing

### Analytics
- [ ] Fathom or privacy-friendly analytics
- [ ] Track image uploads
- [ ] Track dither operations

### Advanced Options
- [ ] Image output format selection (PNG/JPG/WebP)
- [ ] Quality setting for lossy formats

---

## Already Implemented in v3

- [x] Basic dithering (error diffusion + Bayer)
- [x] All 11 error diffusion algorithms
- [x] Color count selection
- [x] Serpentine toggle
- [x] Pixeliness/block size control
- [x] Dark mode support
- [x] Drag and drop upload
- [x] Clipboard paste upload (Cmd/Ctrl+V)
- [x] Download dithered image
- [x] Collapsible sidebar
- [x] Palette preview (read-only)

---

## Accessibility (WCAG 2.2 AA)

Static code review, not yet verified with axe/Lighthouse or a screen reader. Items marked "verify" need a browser check.

### Already in place
- [x] `lang="en"`, `<main>`, sr-only `<h1>` on home page
- [x] `aria-label` on most icon-only buttons
- [x] NuxtUI/Reka primitives for modals, selects, switches, sliders (keyboard + focus trap)
- [x] `prefers-reduced-motion` on Quant Frog
- [x] Compare slider images have Original/Dithered alt text
- [x] Thumbnail buttons have `aria-label` and `aria-pressed`

### Quick wins
- [ ] Name the swatch remove (×) and "Add color" (+) buttons; make remove visible on focus (1.1/4.1.2, 2.4.7) — `PaletteEditor.vue:174,186`
- [ ] Make `HelpTooltip` trigger a real `<button>` with an accessible name so help text is keyboard reachable (2.1.1, 4.1.2) — `HelpTooltip.vue`
- [ ] "Submit Feedback" is a styled `<span>`; make it a real link/button (2.1.1) — `SidebarFeedback.vue:17`
- [ ] Right-menu "Contact" row: replace `NuxtLink` + `role="button"` + `@keydown.enter` with a real `<button>` (Space support, 4.1.2) — `index.vue:1487`
- [ ] Better main-image alt, e.g. "Dithered version of {fileName}" (1.1.1) — `index.vue:1184,1195`
- [ ] Add `aria-live="polite"` region announcing processing/complete/failed (4.1.3) — spinner in `ImageThumbnailStrip.vue:95`
- [ ] Global `@media (prefers-reduced-motion: reduce)` rule for spin/transitions (2.3.3) — `main.css`
- [ ] Hide honeypot field from assistive tech (`aria-hidden`, `tabindex="-1"`) (1.3.1) — `ContactModal.vue:94`

### Contrast
- [ ] Raise `text-gray-400`/`text-gray-500` helper text, `text-xs` labels and menu rows to 4.5:1 (1.4.3) — `index.vue:1451–1521`, `resources.vue`, `PaletteEditor.vue:189`, `SidebarPixelScale.vue`
- [ ] Raise `border-gray-100` on controls (add-color button, thumbnails) to 3:1 (1.4.11) — `PaletteEditor.vue:189`, `ImageThumbnailStrip.vue:83,106`
- [ ] Check brand red `#C53030` as text on dark gray-800 (1.4.3) — verify
- [ ] Selected-thumbnail border change has 3:1 against unselected (1.4.11) — verify
- [ ] Record accessible color pairings in `DESIGN-SYSTEM.md` and `/design-system`

### Structure and forms
- [ ] Skip link; `<aside aria-label>` for sidebar; resolve duplicate `<footer>` landmarks (2.4.1) — `index.vue`, layouts
- [ ] Associate labels with `UInput`/`USelect`/sliders (`UFormField` or `<label for>`); newsletter input has only a placeholder (1.3.1, 3.3.2) — `SidebarDitherMode.vue`, `NewsletterSignup.vue`, `ImageSizeControl.vue`
- [ ] Touch/pointer targets at least 24×24px; remove badge is 16px (2.5.8) — `PaletteEditor.vue:174`, `size="xs"` icon buttons
- [ ] Focused elements not hidden behind fixed header/footer (2.4.11) — `AppHeader.vue`, `index.vue:1364`
- [ ] Focus rings clearly visible on swatches and thumbnails (2.4.7) — verify
- [ ] Pause control for autoplaying animated GIFs (2.2.2) — `ImageCompare.vue`

### Canvas interactions
- [ ] Keyboard/single-pointer alternative for resize handles — Size inputs likely cover it (2.1.1, 2.5.7) — `ResizableImage.vue`, verify
- [ ] Compare slider is keyboard operable and the zoom/pan overlay doesn't trap focus or keys (2.1.1, 2.5.7) — `ImageCompare.vue`, `index.vue`
- [ ] Empty-state upload control is a real focusable button, not just a drop target (2.1.1) — `index.vue:896,1076`
- [ ] Reflow at 320px / 400% zoom; fixed-viewport `overflow-hidden` layout may clip (1.4.10) — verify
- [ ] Color picker has keyboard access and a name — verify

### Content pages and modals
- [ ] Blog/content pages: heading order, link underlines, external-link text (1.3.1, 2.4.4) — verify
- [ ] Contact modal returns focus to its trigger on close — verify
- [ ] Contact link in consistent location on all pages (3.2.6) — likely OK

### Verification
- [ ] Run axe/Lighthouse on `/`, `/about`, `/resources`, `/contact`, one blog post
- [ ] Keyboard-only pass over upload → dither → download
- [ ] VoiceOver pass over the same flow
- [ ] Optional: `eslint-plugin-vuejs-accessibility` or axe in CI; publish an accessibility statement

---

## v3 Advantages Over Original

- Modern Nuxt 4 + Vue 3 architecture
- TypeScript throughout
- NuxtUI v3 component library
- Tailwind CSS v4
- Dark mode built-in
- Cleaner, more maintainable codebase
- Better separation of concerns (composables/utils)
