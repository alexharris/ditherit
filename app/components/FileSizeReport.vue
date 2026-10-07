<script setup lang="ts">
const props = defineProps<{
  originalSize: number // in bytes
  ditheredFileSize: number | null // in bytes, in the original file format
  originalWidth?: number
  originalHeight?: number
  ditheredWidth?: number
  ditheredHeight?: number
}>()

const originalKb = computed(() => (props.originalSize / 1024).toFixed(1))
const ditheredKb = computed(() => ((props.ditheredFileSize || 0) / 1024).toFixed(1))

const percentage = computed(() => {
  if (!props.originalSize || !props.ditheredFileSize) return 0
  return ((props.ditheredFileSize / props.originalSize) * 100).toFixed(1)
})

const strokeDashArray = computed(() => {
  if (!props.originalSize || !props.ditheredFileSize) return '0 100'
  const pct = (props.ditheredFileSize / props.originalSize) * 100
  return `${pct} ${100 - pct}`
})

const isSmaller = computed(() => (props.ditheredFileSize || 0) < props.originalSize)

const isDimensionsIncreased = computed(() => {
  if (!props.originalWidth || !props.originalHeight || !props.ditheredWidth || !props.ditheredHeight) return false
  return props.ditheredWidth > props.originalWidth || props.ditheredHeight > props.originalHeight
})

const upscalePercent = computed(() => {
  if (!props.originalWidth || !props.ditheredWidth) return 0
  return Math.round((props.ditheredWidth / props.originalWidth - 1) * 100)
})

const savedKb = computed(() => {
  const saved = (props.originalSize - (props.ditheredFileSize || 0)) / 1024
  return saved > 0 ? saved.toFixed(1) : '0'
})
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- Card title -->
    <p class="mb-2 w-full text-sm font-medium text-highlighted">File Size</p>

    <!-- Donut Chart -->
    <div class="w-full max-w-32 lg:max-w-none">
      <svg viewBox="0 0 42 42" class="w-full">
        <!-- Background ring -->
        <circle
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke="currentColor"
          stroke-width="3"
          class="text-gray-100 dark:text-gray-800"
        />
        <!-- Percentage segment -->
        <circle
          v-if="ditheredFileSize"
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          :style="{ stroke: isSmaller ? '#22c55e' : 'var(--ui-primary)' }"
          stroke-width="3"
          :stroke-dasharray="strokeDashArray"
          stroke-dashoffset="25"
          class="transition-all duration-300"
        />
        <!-- Center text -->
        <text
          x="21"
          y="21"
          text-anchor="middle"
          dominant-baseline="middle"
          class="fill-current"
          :class="ditheredFileSize ? 'text-gray-800 dark:text-gray-100' : 'text-gray-100 dark:text-gray-400'"
        >
          <!-- Text scales with the chart; shrink it where the chart is uncapped so it reads at the same size -->
          <tspan x="21" font-size="5" font-weight="bold" class="lg:text-[3px]">{{ ditheredFileSize ? `${percentage}%` : '—' }}</tspan>
        </text>
      </svg>
    </div>

    <!-- Saved amount -->
    <p
      class="mt-1 text-sm font-medium"
      :class="ditheredFileSize && isSmaller ? 'text-green-600 dark:text-green-400' : 'text-gray-100 dark:text-gray-400'"
    >
      {{ ditheredFileSize && isSmaller ? `${savedKb} KB` : '— KB' }} saved
    </p>

    <!-- Size details -->
    <div class="mt-3 w-full space-y-1.5 text-xs">
      <div class="flex flex-wrap justify-between gap-x-1">
        <span class="text-gray-800 dark:text-gray-100">Original</span>
        <span class="font-medium text-gray-800 dark:text-gray-100">{{ originalKb }} KB</span>
      </div>
      <div class="flex flex-wrap justify-between gap-x-1">
        <span class="text-gray-800 dark:text-gray-100">Dithered</span>
        <span
          class="font-medium"
          :class="ditheredFileSize
            ? (isSmaller ? 'text-green-600 dark:text-green-400' : 'text-primary')
            : 'text-gray-100 dark:text-gray-400'"
        >
          {{ ditheredFileSize ? `${ditheredKb} KB` : '— KB' }}
        </span>
      </div>
    </div>

    <!-- Upscale note -->
    <p v-if="isDimensionsIncreased" class="mt-3 w-full text-center text-xs text-amber-500 dark:text-amber-400">
      Image upscaled {{ upscalePercent }}%
    </p>
  </div>
</template>
