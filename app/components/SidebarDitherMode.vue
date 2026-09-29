<script setup lang="ts">
import type { DitherMode } from '~/composables/useDithering'
import { DIFFUSION_ALGORITHMS } from '~/composables/useDithering'
import { BAYER_SIZES, KNOLL_PATTERNS } from '~/utils/dithering'

const {
  ditherMode,
  algorithm,
  serpentine,
  bayerSize,
  knollPattern
} = useDithering()

const ditherModes: Array<{ label: string; value: DitherMode }> = [
  { label: 'Error Diffusion', value: 'diffusion' },
  { label: 'Bayer (Ordered)', value: 'bayer' },
  { label: 'Knoll', value: 'pattern' },
  { label: 'Blue Noise', value: 'blue-noise' },
  { label: 'Riemersma', value: 'riemersma' }
]

const advancedOpen = ref(false)
</script>

<template>
  <div class="space-y-4 px-4 py-4">
    <HelpTooltip>
      <template #label>
        <span class="text-sm font-medium text-highlighted">Dither Mode</span>
      </template>
      <template #help>
        These methods are different ways to spread around the quantization
        error introduced by reducing an image's color palette. They look quite
        different, try them out!
      </template>
      <USelect
        v-model="ditherMode"
        :items="ditherModes"
        class="mt-2 w-full"
        :ui="{ base: 'text-left' }"
      />
    </HelpTooltip>

    <!-- Algorithm (for diffusion mode) -->
    <div v-if="ditherMode === 'diffusion'" class="space-y-1.5">
      <span class="text-xs font-medium uppercase tracking-wide text-muted">Algorithm</span>
      <USelect
        v-model="algorithm"
        :items="DIFFUSION_ALGORITHMS"
        class="w-full"
      />
    </div>

    <!-- Matrix Size (for bayer mode) -->
    <div v-if="ditherMode === 'bayer'" class="space-y-1.5">
      <span class="text-xs font-medium uppercase tracking-wide text-muted">Matrix Size</span>
      <USelect
        v-model="bayerSize"
        :items="BAYER_SIZES"
        class="w-full"
      />
    </div>

    <!-- Threshold pattern (for Knoll pattern mode) -->
    <div v-if="ditherMode === 'pattern'" class="space-y-1.5">
      <HelpTooltip>
        <template #label>
          <span class="text-xs font-medium uppercase tracking-wide text-muted">Knoll Pattern</span>
        </template>
        <template #help>
          The pattern to use for the Knoll dither
        </template>
        <USelect
          v-model="knollPattern"
          :items="KNOLL_PATTERNS"
          class="mt-1.5 w-full"
        />
      </HelpTooltip>
    </div>

    <!-- Advanced (serpentine — diffusion only) -->
    <UCollapsible
      v-if="ditherMode === 'diffusion'"
      v-model:open="advancedOpen"
    >
      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        label="Advanced"
        class="-mx-1 text-xs font-medium uppercase tracking-wide text-muted"
      >
        <template #trailing>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-3 transition-transform duration-200"
            :class="advancedOpen ? 'rotate-90' : ''"
          />
        </template>
      </UButton>
      <template #content>
        <div class="space-y-3 pt-3">
          <HelpTooltip>
            <template #label>
              <UCheckbox
                v-model="serpentine"
                label="Serpentine"
              />
            </template>
            <template #help>
              This determines if the dithering just goes left to right, top to
              bottom, or does a snake wiggle.
            </template>
          </HelpTooltip>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
