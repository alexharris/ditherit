<script setup lang="ts">
definePageMeta({ layout: 'content' })

const colorGroups = [
  {
    label: 'Brand & Primary',
    note: '#C53030 — css var --color-ditherit, ui.colors.primary: "ditherit"',
    colors: [
      { name: 'ditherit', hex: '#C53030', class: 'bg-[#C53030]', textClass: 'text-white' },
      { name: 'red-100', hex: '#FEE2E2', class: 'bg-red-100', textClass: 'text-gray-800' }
    ]
  },
  {
    label: 'Neutral',
    note: 'Light mode: gray-100/500/800. Dark mode adds gray-400 (muted text) and gray-900 (app bg)',
    colors: [
      { name: 'gray-100', hex: '#F3F4F6', class: 'bg-gray-100', textClass: 'text-gray-800' },
      { name: 'gray-400', hex: '#9CA3AF', class: 'bg-gray-400', textClass: 'text-gray-800' },
      { name: 'gray-500', hex: '#6B7280', class: 'bg-gray-500', textClass: 'text-white' },
      { name: 'gray-800', hex: '#1F2937', class: 'bg-gray-800', textClass: 'text-white' },
      { name: 'gray-900', hex: '#111827', class: 'bg-gray-900', textClass: 'text-white' }
    ]
  },
  {
    label: 'Semantic',
    note: 'Success, error, warning, info',
    colors: [
      { name: 'green-400', hex: '#00DC82', class: 'bg-green-400', textClass: 'text-gray-800' },
      { name: 'red-500', hex: '#EF4444', class: 'bg-red-500', textClass: 'text-white' },
      { name: 'amber-500', hex: '#F59E0B', class: 'bg-amber-500', textClass: 'text-white' },
      { name: 'blue-500', hex: '#3B82F6', class: 'bg-blue-500', textClass: 'text-white' }
    ]
  }
]

const typeScale = [
  { role: 'Page Title', classes: 'text-3xl font-bold', sample: 'Dither it!' },
  { role: 'Section Header', classes: 'text-xl font-semibold', sample: 'Color Palette' },
  { role: 'Body', classes: 'text-base font-normal', sample: 'Dithering is a technique to create the illusion of color depth in images with a limited palette.' },
  { role: 'Label', classes: 'text-sm font-medium', sample: 'Pixel Scale' },
  { role: 'Section Label', classes: 'text-xs font-medium uppercase tracking-wide', sample: 'Advanced Options' },
  { role: 'Caption', classes: 'text-xs font-normal', sample: '14.2 KB → 3.1 KB' }
]

const commonIcons = [
  'i-lucide-upload', 'i-lucide-download', 'i-lucide-image', 'i-lucide-palette',
  'i-lucide-trash-2', 'i-lucide-check', 'i-lucide-x', 'i-lucide-plus',
  'i-lucide-chevron-down', 'i-lucide-chevron-right', 'i-lucide-arrow-left', 'i-lucide-arrow-up-right',
  'i-lucide-sun', 'i-lucide-moon', 'i-lucide-menu', 'i-lucide-help-circle',
  'i-lucide-copy', 'i-lucide-rss', 'i-lucide-mail', 'i-simple-icons-github'
]

const selectItems = ['Floyd-Steinberg', 'Atkinson', 'Stucki']
const selectValue = ref('Floyd-Steinberg')
const checkboxValue = ref(true)
const sliderValue = ref(4)
const inputNumberValue = ref(16)
</script>

<template>
  <div class="space-y-16">
    <!-- Intro -->
    <section>
      <p class="text-base text-gray-500 dark:text-gray-400">
        Visual language reference for Dither it! — use this when building new features to ensure consistency.
      </p>
      <nav class="mt-3 flex flex-wrap gap-2">
        <a
          v-for="id in ['colors', 'typography', 'buttons', 'forms', 'badges', 'icons', 'borders']"
          :key="id"
          :href="`#${id}`"
          class="text-xs text-[#C53030] hover:underline capitalize"
        >{{ id }}</a>
      </nav>
    </section>

    <!-- Colors -->
    <section id="colors">
      <h2 class="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Colors
      </h2>
      <div class="space-y-6">
        <div v-for="group in colorGroups" :key="group.label">
          <div class="mb-2 flex items-baseline gap-2">
            <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {{ group.label }}
            </p>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ group.note }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="color in group.colors"
              :key="color.name"
              :class="[color.class, 'flex h-14 w-24 flex-col items-center justify-center rounded-md border border-black/5 text-center']"
            >
              <span :class="[color.textClass, 'text-[10px] font-medium leading-tight px-1']">{{ color.name }}</span>
              <span :class="[color.textClass, 'text-[10px] opacity-70']">{{ color.hex }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <USeparator />

    <!-- Typography -->
    <section id="typography">
      <h2 class="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Typography
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Font: <strong>Public Sans</strong>.
      </p>
      <div class="space-y-5">
        <div
          v-for="item in typeScale"
          :key="item.role"
          class="flex flex-col gap-1 border-b border-gray-100 pb-5 dark:border-gray-800"
        >
          <div class="flex items-baseline gap-3">
            <span class="w-32 shrink-0 text-xs text-gray-500 dark:text-gray-400">{{ item.role }}</span>
            <span :class="[item.classes, 'text-gray-800 dark:text-gray-100']">{{ item.sample }}</span>
          </div>
          <code class="ml-32 text-xs text-gray-500 dark:text-gray-400">{{ item.classes }}</code>
        </div>
      </div>
    </section>

    <USeparator />

    <!-- Buttons -->
    <section id="buttons">
      <h2 class="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Buttons
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Always use <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">UButton</code>. Never use raw <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">&lt;button&gt;</code> except in Netlify forms.
      </p>

      <div class="space-y-8">
        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Primary CTA
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <UButton label="Download" icon="i-lucide-download" color="primary" variant="solid" />
            <UButton label="Apply" color="primary" variant="solid" />
            <UButton label="Loading" color="primary" variant="solid" loading />
            <UButton label="Disabled" color="primary" variant="solid" disabled />
          </div>
          <code class="mt-2 block text-xs text-gray-500">color="primary" variant="solid"</code>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Secondary / Ghost
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <UButton label="About" color="neutral" variant="ghost" />
            <UButton icon="i-lucide-copy" color="neutral" variant="ghost" aria-label="Copy" />
            <UButton label="GitHub" icon="i-simple-icons-github" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-up-right" />
          </div>
          <code class="mt-2 block text-xs text-gray-500">color="neutral" variant="ghost" — active route uses variant="soft"</code>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Destructive
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <UButton label="Delete" icon="i-lucide-trash-2" color="error" variant="ghost" />
            <UButton label="Remove all" color="error" variant="soft" />
          </div>
          <code class="mt-2 block text-xs text-gray-500">color="error"</code>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Outline
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <UButton label="❤️ Support" color="primary" variant="outline" class="bg-white dark:bg-gray-800" />
            <UButton label="Learn more" color="primary" variant="outline" class="bg-white dark:bg-gray-800" />
          </div>
          <code class="mt-2 block text-xs text-gray-500">color="primary" variant="outline" class="bg-white dark:bg-gray-800" — white bg is standard for outline buttons</code>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Sizes — two tiers
          </p>
          <div class="flex flex-wrap items-end gap-3">
            <UButton label="sm — toolbar, nav, secondary" color="neutral" variant="ghost" size="sm" />
            <UButton label="md — standalone CTAs" color="neutral" variant="ghost" size="md" />
          </div>
        </div>
      </div>
    </section>

    <USeparator />

    <!-- Forms -->
    <section id="forms">
      <h2 class="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Form Controls
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Always use NuxtUI, Netlify forms included — Netlify detects fields from the static form in public/__forms.html.
      </p>

      <div class="space-y-8">
        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            UInput
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
            <UInput placeholder="Default" />
            <UInput placeholder="With icon" icon="i-lucide-mail" />
            <UInput placeholder="Error" color="error" />
            <UInput placeholder="Disabled" disabled />
          </div>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            USelect
          </p>
          <USelect v-model="selectValue" :items="selectItems" class="w-56" />
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            UCheckbox &amp; USlider
          </p>
          <div class="flex flex-col gap-4">
            <div class="flex gap-4">
              <UCheckbox v-model="checkboxValue" label="Serpentine" />
              <UCheckbox :model-value="false" label="Unchecked" />
            </div>
            <div class="w-64">
              <USlider v-model="sliderValue" :min="1" :max="25" :step="1" />
              <p class="mt-1 text-xs text-gray-500">
                {{ sliderValue }}x
              </p>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            UInputNumber
          </p>
          <UInputNumber v-model="inputNumberValue" :min="2" :max="32" size="xs" class="w-24" />
          <code class="mt-2 block text-xs text-gray-500">size="xs" — used for color count</code>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            UFormField
          </p>
          <div class="max-w-md space-y-4">
            <UFormField label="Email" hint="Optional">
              <UInput placeholder="you@example.com" class="w-full" />
            </UFormField>
          </div>
        </div>
      </div>
    </section>

    <USeparator />

    <!-- Badges -->
    <section id="badges">
      <h2 class="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Badges
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Use <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">UBadge</code> for semantic labels. Algorithm mode badges use custom classes to match the sidebar.
      </p>

      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge label="neutral" color="neutral" variant="subtle" />
          <UBadge label="primary" color="primary" variant="solid" />
          <UBadge label="success" color="success" variant="solid" />
          <UBadge label="error" color="error" variant="solid" />
          <UBadge label="warning" color="warning" variant="solid" />
        </div>
        <div class="flex gap-2">
          <span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Bayer</span>
          <span class="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Diffusion</span>
        </div>
        <code class="block text-xs text-gray-500">Algorithm badges: bg-amber-100/blue-100 text-amber-700/blue-700 (custom, not UBadge)</code>
      </div>
    </section>

    <USeparator />

    <!-- Icons -->
    <section id="icons">
      <h2 class="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Icons
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Use <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">i-lucide-*</code> for all UI icons. Brand logos: <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">i-simple-icons-*</code>. Sizes: <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">size-4</code> inline, <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">size-5</code> standalone, <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">size-6</code> decorative.
      </p>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="icon in commonIcons"
          :key="icon"
          class="flex flex-col items-center gap-1 rounded-md border border-gray-100 p-2 dark:border-gray-800"
          :title="icon"
        >
          <UIcon :name="icon" class="size-5 text-gray-800 dark:text-gray-100" />
          <span class="w-16 text-center text-[9px] text-gray-500">{{ icon.replace('i-lucide-', '').replace('i-simple-icons-', '') }}</span>
        </div>
      </div>
    </section>

    <USeparator />

    <!-- Borders & Radius -->
    <section id="borders">
      <h2 class="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Borders &amp; Radius
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        No drop shadows except NuxtUI defaults.
      </p>

      <div class="space-y-6">
        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Border Colors
          </p>
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="h-8 w-32 rounded border border-gray-100 dark:border-gray-800" />
              <code class="text-xs text-gray-500">border-gray-100 dark:border-gray-800 — all borders</code>
            </div>
            <div class="flex items-center gap-3">
              <div class="h-8 w-32 rounded border-2 border-[#C53030]" />
              <code class="text-xs text-gray-500">border-[#C53030] — focus rings, active swatches</code>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Border Radius
          </p>
          <div class="flex flex-wrap items-end gap-4">
            <div class="flex flex-col items-center gap-2">
              <div class="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800" />
              <code class="text-xs text-gray-500">rounded-lg</code>
              <span class="text-xs text-gray-500">everything</span>
            </div>
            <div class="flex flex-col items-center gap-2">
              <div class="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800" />
              <code class="text-xs text-gray-500">rounded-full</code>
              <span class="text-xs text-gray-500">swatches, circles</span>
            </div>
          </div>
          <p class="mt-3 text-xs text-gray-500 dark:text-gray-400">NuxtUI components (UButton, UInput) use <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">rounded-md</code> internally — don't override them.</p>
        </div>
      </div>
    </section>

    <USeparator />

    <!-- Cards -->
    <section id="cards">
      <h2 class="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Cards
      </h2>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Always use <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">UCard</code>. Use <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">variant="outline"</code> (default) for neutral cards, <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">variant="soft"</code> with a custom background for colored/semantic cards. Emoji prefix required on colored card titles.
      </p>

      <div class="space-y-8">
        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Neutral — variant="outline" (default)
          </p>
          <UCard class="max-w-xs" :ui="{ body: 'p-3 sm:p-3' }">
            <p class="mb-1 text-sm font-medium text-highlighted">🔒 Privacy First</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">100% client-side. Your images never leave your device.</p>
          </UCard>
          <code class="mt-3 block text-xs text-gray-500">&lt;UCard :ui="{ body: 'p-3 sm:p-3' }"&gt; — emoji prefix, text-sm font-medium text-highlighted title</code>
        </div>

        <div>
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Colored / Semantic — variant="soft" + custom bg
          </p>
          <div class="flex flex-col gap-3 max-w-xs">
            <UCard variant="soft" :ui="{ root: 'bg-ditherit-tint', body: 'p-4 sm:p-4' }">
              <p class="mb-1 text-sm font-medium text-highlighted">📋 Improve Dither it!</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">Found a bug? Have an idea for a feature?</p>
            </UCard>
            <UCard variant="soft" :ui="{ root: 'bg-gray-100 dark:bg-gray-800', body: 'p-3 sm:p-3' }">
              <p class="mb-1 text-sm font-medium text-highlighted">✏️ From the blog</p>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Post title here</p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Post description here</p>
            </UCard>
          </div>
          <div class="mt-3 space-y-1">
            <code class="block text-xs text-gray-500">&lt;UCard variant="soft" :ui="{ root: 'bg-ditherit-tint', body: 'p-4 sm:p-4' }"&gt;</code>
            <code class="block text-xs text-gray-500">Title: text-sm font-medium text-highlighted + emoji prefix (required)</code>
            <code class="block text-xs text-gray-500">Body: text-sm text-gray-500 dark:text-gray-400</code>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
