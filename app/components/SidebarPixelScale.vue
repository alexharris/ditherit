<script setup lang="ts">
const {
  pixeliness,
  pixelScale,
  smoothPixels,
  originalWidth,
  originalHeight,
  sizeWidth,
  sizeValid,
  autoApply
} = useDithering()

function handleSizeChange(payload: { width: number | undefined; valid: boolean }) {
  sizeWidth.value = payload.width
  sizeValid.value = payload.valid
}

const advancedOpen = ref(false)
</script>

<template>
  <div v-if="originalWidth > 0" class="px-4 py-4">
    <span class="text-sm font-medium text-highlighted">Size</span>
    <div class="mt-2">
      <ImageSizeControl
        :original-width="originalWidth"
        :original-height="originalHeight"
        :initial-width="sizeWidth"
        :auto-apply="autoApply"
        @change="handleSizeChange"
      />
    </div>
  </div>

  <USeparator v-if="originalWidth > 0" />

  <div class="px-4 py-4 space-y-3">
    <HelpTooltip>
      <template #label>
        <span class="text-sm font-medium text-highlighted">Pixel Scale</span>
      </template>
      <template #help>
        Make the "pixels" bigger for a chunkier look
      </template>
      <div class="mt-2">
        <USlider v-model="pixelScale" :min="1" :max="25" :step="1" />
        <span class="text-xs text-gray-500">{{ pixelScale }}x</span>
      </div>
    </HelpTooltip>

    <UButton
      color="neutral"
      variant="ghost"
      size="sm"
      class="-mx-2"
      @click="advancedOpen = !advancedOpen"
    >
      <span class="text-xs font-medium uppercase tracking-wide text-muted">Advanced</span>
      <UIcon
        name="i-lucide-chevron-right"
        class="size-3 transition-transform duration-200"
        :class="{ 'rotate-90': advancedOpen }"
      />
    </UButton>

    <div v-if="advancedOpen" class="rounded-md border border-gray-200 dark:border-gray-700 p-3 space-y-3">
      <HelpTooltip>
        <template #label>
          <span class="text-xs font-medium uppercase tracking-wide text-muted">Pixeliness</span>
        </template>
        <template #help>
          Dither at full size, then reduce and re-enlarge to create larger pixels. Can be messy.
        </template>
        <div class="mt-2">
          <USlider v-model="pixeliness" :min="1" :max="25" :step="1" />
          <span class="text-xs text-gray-500">{{ pixeliness }}x</span>
        </div>
      </HelpTooltip>
      <HelpTooltip>
        <template #label>
          <UCheckbox v-model="smoothPixels" label="Smooth pixels" />
        </template>
        <template #help>
          Pixeliness will make "softer" images, but may introduce colors outside of the selected palette.
        </template>
      </HelpTooltip>
    </div>
  </div>

  <USeparator />
</template>
