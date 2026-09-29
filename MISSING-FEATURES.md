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
- [ ] Toggle between original and dithered views (optional)
- [ ] Full width toggle when viewing original (optional)

---

## High Priority (Should Have)

### Examples Gallery
- [ ] Showcase example images (frog, earth)
- [x] Before/after comparison slider (img-comparison-slider) - component ready
- [ ] Examples for different dither modes
- [ ] Examples for different palettes

### Help System
- [x] Contextual help tooltips for controls
- [ ] Explanation for Dither Mode
- [ ] Explanation for Image Size options
- [ ] Explanation for palette features

### Resources Page
- [x] `/resources` route
- [x] Curated list of dithering resources
- [x] Links to tools, articles, tutorials

---

## Medium Priority (Nice to Have)

### Updates/Changelog Section
- [x] Display recent updates
- [x] Feature announcements with timestamps
- [ ] Scrollable changelog

### Contact Form
- [ ] Email widget integration (Letterbird or alternative)
- [ ] Bug report submission
- [ ] Feature request submission

### Donation Support
- [ ] Ko-fi button or similar
- [ ] Support link in footer

### GIF Export
- [ ] Reduce flicker: keep a pixel's previous dithered color when its source color barely changed (e.g. within ±8 per channel) since that pixel was last updated. Comparing against the last-updated source, not the previous frame, stops slow fades from freezing. Noisy source GIFs flicker in every mode — measured with ±3 source noise: Floyd-Steinberg ~42% of pixels flip per frame, Knoll ~4.5%, Bayer ~1.4%. Also shrinks GIF file size.
- [ ] Suggest an ordered mode (Bayer, Knoll, Blue Noise) when a GIF is loaded with Error Diffusion selected — error diffusion flickers most between frames.

### Color Selection Methods
- [ ] Add Wu's quantizer to `PALETTE_ALGORITHMS` (`app/utils/palette-analysis.ts`) — high quality and fast. Other candidates: octree, NeuQuant.

### Blog/Quant Page
- [ ] `/quant` route
- [ ] Quarterly reports / blog posts

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

## v3 Advantages Over Original

- Modern Nuxt 4 + Vue 3 architecture
- TypeScript throughout
- NuxtUI v3 component library
- Tailwind CSS v4
- Dark mode built-in
- Cleaner, more maintainable codebase
- Better separation of concerns (composables/utils)
