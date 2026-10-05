<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()
const { autoApply, colorSpace, pixelatedRendering } = useDithering()
const { autoDownscale } = useImageGallery()
const colorMode = useColorMode()
</script>

<template>
  <div class="space-y-4" data-vaul-no-drag>
    <div class="flex items-center justify-between py-4">
      <span class="text-sm font-medium text-highlighted">Settings</span>
      <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Close" @click="emit('close')" />
    </div>

    <div class="space-y-3">
      <div class="space-y-1">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-gray-700 dark:text-gray-300">Auto-dither</span>
          <USwitch v-model="autoApply" size="sm" />
        </div>
        <p class="text-xs text-muted">Re-dithers automatically when any setting changes. Turn off to apply changes manually.</p>
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-gray-700 dark:text-gray-300">Auto-downscale</span>
          <USwitch v-model="autoDownscale" size="sm" />
        </div>
        <p class="text-xs text-muted">Shrinks images larger than 4096px on their longest side when added. Turn off to keep full resolution, which may be slow or fail on some devices.</p>
      </div>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-4">
        <span class="text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
        <USwitch
          :model-value="colorMode.value === 'dark'"
          size="sm"
          @update:model-value="colorMode.preference = $event ? 'dark' : 'light'"
        />
      </div>
      <div class="space-y-1">
        <div class="flex items-center justify-between gap-4">
          <span class="text-sm text-gray-700 dark:text-gray-300">Pixelated rendering</span>
          <USwitch v-model="pixelatedRendering" size="sm" />
        </div>
        <p class="text-xs text-muted">Forces sharp pixel edges with no anti-aliasing. Useful when the image is displayed at a non-native size.</p>
      </div>
    </div>

    <div class="space-y-3">
      <div class="space-y-1.5">
        <span class="text-sm text-gray-700 dark:text-gray-300">Color Space</span>
        <p class="text-xs text-muted">OKLab produces better hue fidelity on colorful images. Applies to error diffusion and Riemersma modes.</p>
        <USelect
          v-model="colorSpace"
          :items="[{ label: 'RGB', value: 'rgb' }, { label: 'OKLab', value: 'oklab' }]"
          class="w-full"
          :ui="{ base: 'text-left' }"
        />
      </div>
    </div>
  </div>
</template>
