# Translation Plan

## Context
Plan for offering the site in other languages (written 2026-09-24, not yet started). Right now every string is hardcoded English inside the Vue templates, so the work is mostly pulling strings out plus a small amount of setup. The site is a static SPA (`ssr: false`, `pnpm generate` → Netlify) with no backend, so no server changes are needed.

## What's there now
- About 5,600 lines of Vue/TS UI across 7 pages, 18 components, 3 layouts. Most strings live in `app/pages/index.vue` (1.3k lines), `PaletteEditor.vue`, the `Sidebar*` components, `AppHeader.vue`, and the content pages (`about`, `resources`, `support`, `contact`).
- Label arrays in script code, e.g. `ditherModes` in `app/components/SidebarDitherMode.vue:13`, `DIFFUSION_ALGORITHMS` in `useDithering.ts`, and the 16 preset palette `name`s in `usePalette.ts`.
- Help text in `HelpTooltip` slots.
- SEO strings: `nuxt.config.ts` meta description, `useSeoMeta` titles in each page, plus `app/app.vue`.
- Blog: `@nuxt/content` collection `blog/*.md` (4 posts), plus `server/routes/rss.xml.ts` and `blog-latest.json.ts`.
- NuxtUI v4 ships its own locale packs for built-in component text (for example "No data" and close labels).

## Recommended approach
1. **Install `@nuxtjs/i18n`** (v10, supports Nuxt 4) and add it to `modules`. Config:
   - `strategy: 'prefix_except_default'`: English stays at `/`, other languages at `/es/`, `/fr/` and so on. This gives each language a shareable, indexable URL, and `nuxt generate` prerenders every locale.
   - `detectBrowserLanguage: { useCookie: true, redirectOn: 'root' }`
   - `lazy: true` with one JSON file per language in `i18n/locales/{en,es,...}.json`
2. **Extract strings** into keys grouped by area: `nav.*`, `sidebar.mode.*`, `palette.*`, `upload.*`, `pages.about.*`, `seo.*`.
   - Templates: `Dither Mode` → `{{ $t('sidebar.mode.label') }}`
   - Script arrays: turn them into `computed(() => [...t(...)])` so labels update when the language changes. Keep the `value` fields as they are.
   - Leave proper nouns alone: algorithm names (Floyd-Steinberg, Atkinson…) and matrix sizes (`4x4`). Palette names are optional to translate.
   - For long prose pages (`about.vue`, `resources.vue`), consider one Markdown file per locale through Nuxt Content instead of dozens of paragraph keys.
3. **Language switcher**: a `USelect` or `UDropdownMenu` in `AppHeader.vue` using `useSwitchLocalePath()`, following `DESIGN-SYSTEM.md` and added to `design-system.vue`.
4. **NuxtUI locale**: wrap the app in `<UApp :locale="uiLocales[locale]">` in `app.vue`, using `import * as uiLocales from '@nuxt/ui/locale'`.
5. **SEO**: move titles and descriptions into the locale files. Use `useLocaleHead()` for `<html lang>`, `hreflang` alternates, and canonical links. Move the meta description out of `nuxt.config.ts` into `app.vue`.
6. **Blog, which is optional and the biggest ongoing cost**: keep the blog English-only at first. Later, if you want to translate it, add per-locale collections (`content/es/blog/*.md`) and filter by locale in the blog queries and in the RSS and latest-post routes.
7. **Guardrails**: add `@intlify/eslint-plugin-vue-i18n`, or at least its `no-raw-text` rule, so new English strings don't slip back into templates.

## Effort estimate
| Piece | Effort |
|---|---|
| Module setup, config, switcher, NuxtUI locale, SEO/hreflang | ~0.5 day |
| String extraction (≈300–400 strings, mostly `index.vue`, sidebar, palette editor) | ~1–1.5 days |
| Content pages (about/resources/support/contact) | ~0.5 day |
| Each translation | Machine translation plus review by a native speaker; ongoing upkeep for every new UI string |
| Blog translation | Optional; per post, ongoing |

**Roughly 2–3 days of engineering** for the framework and English extraction. After that, adding a language is mainly writing one JSON file.

## Languages (decided)
Chosen from Fathom analytics (2026-09-24 export, about 63k visitors). Together these four cover about 17.6% of visitors.
- `en`: the default, served at `/`.
- `es`: Spanish, 5.8%, spread across Mexico, Spain, Argentina, Chile and others. Write neutral Latin American Spanish.
- `pt-BR`: Brazilian Portuguese, 5.0%. Use Brazilian, not European, spelling and wording.
- `de`: German, 4.0%. Its longer text is the test case for overflow in the narrow sidebar.
- `fr`: French, 2.8%.

Hindi is deferred. Many Indian visitors use English, and Hindi would also need a Devanagari font, since Public Sans has none.

The first version of each translation will be machine-translated. The help text and about page should get a native-speaker review before launch, if one is available.

## Other decisions
- URL prefixes, as recommended in the approach above.
- The blog stays English-only for now.

## Verification (when implemented)
- `pnpm dev`, switch languages from the header, and confirm that every sidebar, palette, and upload string changes, that dropdown labels update live, and that dithering still works (the values are unchanged).
- Check the sidebar in `de` and `fr` at narrow and mobile widths for labels that overflow or wrap badly.
- `pnpm generate` and check that `dist/{es,pt-BR,de,fr}/index.html` and the other locale pages exist with the right `<html lang>` and `hreflang` tags.
- `pnpm lint` with the i18n raw-text rule to catch strings that were missed.
- `pnpm typecheck` shows no new errors beyond the ~42 that already exist.
