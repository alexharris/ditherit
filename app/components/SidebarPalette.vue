<script setup lang="ts">
const {
  paletteColors,
  customPalettes,
  selectedPreset,
  isCustomPaletteSelected,
  setColorAt,
  addColor,
  removeColor,
  selectPreset,
  saveCurrentPalette,
  deleteCustomPalette,
  importFromJson
} = usePalette()

const { analyzeColorCount, paletteAlgorithm } = useDithering()
</script>

<template>
  <div class="px-4 py-4">
    <HelpTooltip>
      <template #label>
        <span class="text-sm font-medium text-highlighted">Palette</span>
      </template>
      <template #help>
        The color palette used for dithering. Choose a preset, edit individual
        colors, or create and save your own custom palettes.
      </template>
      <PaletteEditor
        :palette="paletteColors"
        :custom-palettes="customPalettes"
        :selected-preset="selectedPreset"
        :is-custom-palette-selected="isCustomPaletteSelected"
        :analyze-color-count="analyzeColorCount"
        :palette-algorithm="paletteAlgorithm"
        class="mt-2"
        @select-preset="selectPreset"
        @set-color="setColorAt"
        @add-color="addColor"
        @remove-color="removeColor"
        @save-custom="saveCurrentPalette"
        @delete-custom="deleteCustomPalette"
        @import="importFromJson"
        @update:analyze-color-count="(v) => analyzeColorCount = v"
        @update:palette-algorithm="(v) => paletteAlgorithm = v"
      />
    </HelpTooltip>
  </div>
</template>
