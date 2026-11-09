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

    <!-- Donut chart with percentage and saved amount beside it -->
    <div class="flex w-full items-center gap-3">
      <svg viewBox="0 0 42 42" class="size-14 shrink-0" aria-hidden="true">
        <!-- Background ring -->
        <circle
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          stroke="currentColor"
          stroke-width="5"
          class="text-gray-100 dark:text-gray-700"
        />
        <!-- Percentage segment -->
        <circle
          v-if="ditheredFileSize"
          cx="21"
          cy="21"
          r="15.91549430918954"
          fill="transparent"
          :style="{ stroke: isSmaller ? '#22c55e' : 'var(--ui-primary)' }"
          stroke-width="5"
          :stroke-dasharray="strokeDashArray"
          stroke-dashoffset="25"
          class="transition-all duration-300"
        />
      </svg>
      <div class="min-w-0">
        <p
          class="text-xl font-bold leading-tight"
          :class="ditheredFileSize ? 'text-gray-800 dark:text-gray-100' : 'text-gray-300 dark:text-gray-500'"
        >
          {{ ditheredFileSize ? `${percentage}%` : '—' }}
        </p>
        <p
          class="text-xs font-medium"
          :class="ditheredFileSize && isSmaller ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-gray-500'"
        >
          {{ ditheredFileSize && isSmaller ? `${savedKb} KB` : '— KB' }} saved
        </p>
      </div>
    </div>

    <!-- Size details -->
    <div class="mt-2 w-full space-y-1 text-xs">
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
    <p v-if="isDimensionsIncreased" class="mt-2 w-full text-center text-xs text-amber-500 dark:text-amber-400">
      Image upscaled {{ upscalePercent }}%
    </p>
  </div>
</template>
