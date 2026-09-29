<script setup lang="ts">
import { PRESET_PALETTES, type PaletteColor } from '~/composables/usePalette'
import { PALETTE_ALGORITHMS, type PaletteAlgorithm } from '~/utils/palette-analysis'

const props = defineProps<{
  palette: PaletteColor[]
  customPalettes: { name: string; colors: PaletteColor[] }[]
  selectedPreset: string
  isCustomPaletteSelected: boolean
  analyzeColorCount: number
  paletteAlgorithm: PaletteAlgorithm
}>()

const emit = defineEmits<{
  (e: 'update:palette', colors: PaletteColor[]): void
  (e: 'update:selectedPreset', value: string): void
  (e: 'selectPreset', value: string): void
  (e: 'setColor', index: number, hex: string): void
  (e: 'addColor'): void
  (e: 'removeColor', index: number): void
  (e: 'saveCustom', name: string): void
  (e: 'deleteCustom', index: number): void
  (e: 'import', json: string): void
  (e: 'update:analyzeColorCount', value: number): void
  (e: 'update:paletteAlgorithm', value: PaletteAlgorithm): void
}>()

const paletteAlgorithmOptions = PALETTE_ALGORITHMS.map(({ label, value }) => ({ label, value }))

// Color count input — local staging value, only committed on apply
const colorCountInput = ref(props.analyzeColorCount)
const isColorCountDirty = computed(() => colorCountInput.value !== props.analyzeColorCount)

watch(() => props.analyzeColorCount, (v) => {
  colorCountInput.value = v
})

function applyColorCount() {
  emit('update:analyzeColorCount', colorCountInput.value)
}

// UI state
const editingIndex = ref<number | null>(null)
const activeTab = ref<'edit' | 'save' | 'export' | 'import' | null>(null)
const newPaletteName = ref('')
const importJson = ref('')
const hexInput = ref('')
const pickerHex = ref('')

// Build dropdown options
const presetOptions = computed(() => {
  const options = [
    { label: 'Original (from image)', value: 'original' },
    { label: 'Custom', value: 'custom', disabled: true }
  ]

  // Add custom palettes
  props.customPalettes.forEach((p, i) => {
    options.push({ label: p.name, value: `custom-${i}` })
  })

  // Add preset palettes
  PRESET_PALETTES.forEach(p => {
    options.push({ label: p.name, value: p.value })
  })

  return options
})

const exportJson = computed(() => JSON.stringify(props.palette, null, 2))

const editingColor = computed(() => {
  if (editingIndex.value === null) return null
  return props.palette[editingIndex.value] ?? null
})

watch(editingColor, (color) => {
  hexInput.value = color?.hex ?? ''
  pickerHex.value = color?.hex ?? ''
})

// Update the picker only when hexInput is a complete valid hex
watch(hexInput, (val) => {
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    pickerHex.value = val
  }
})

function commitHex() {
  if (editingIndex.value !== null && hexInput.value) {
    emit('setColor', editingIndex.value, hexInput.value)
  }
  editingIndex.value = null
}

function handlePresetChange(value: string) {
  emit('selectPreset', value)
}

function handleColorClick(index: number) {
  editingIndex.value = editingIndex.value === index ? null : index
}

function handleAddColor() {
  emit('addColor')
  nextTick(() => {
    editingIndex.value = props.palette.length - 1
  })
}

function handleRemoveColor(index: number) {
  emit('removeColor', index)
  if (editingIndex.value === index) {
    editingIndex.value = null
  }
}

function handleSave() {
  if (newPaletteName.value.trim()) {
    emit('saveCustom', newPaletteName.value)
    newPaletteName.value = ''
    activeTab.value = null
  }
}

function handleDeleteCurrent() {
  if (props.isCustomPaletteSelected) {
    const index = parseInt(props.selectedPreset.replace('custom-', ''))
    emit('deleteCustom', index)
    activeTab.value = null
  }
}

function handleImport() {
  if (importJson.value.trim()) {
    emit('import', importJson.value)
    importJson.value = ''
    activeTab.value = null
  }
}

function downloadExport() {
  const blob = new Blob([exportJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'ditherit_palette.json'
  link.click()
  URL.revokeObjectURL(url)
}

function toggleTab(tab: 'save' | 'export' | 'import') {
  activeTab.value = activeTab.value === tab ? null : tab
  editingIndex.value = null
}
</script>

<template>
  <div class="space-y-3">
    <!-- Color Swatches -->
    <div v-if="palette.length" class="flex flex-wrap gap-1">
      <div v-for="(color, i) in palette" :key="i" class="relative">
        <button
          type="button"
          class="size-9 lg:size-7 rounded-full shadow-sm shadow-black/30 cursor-pointer transition-all"
          :class="[
            editingIndex === i
              ? 'ring-2 ring-ditherit/30 scale-110'
              : ''
          ]"
          :style="{ backgroundColor: color.hex }"
          :aria-label="`Edit color ${color.hex}`"
          @click="handleColorClick(i)"
        />
        <!-- Remove button on hover/edit -->
        <button
          v-if="palette.length > 2"
          type="button"
          class="absolute -right-1 -top-1 size-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 hover:opacity-100 touch-visible transition-opacity"
          :class="{ 'opacity-100': editingIndex === i }"
          @click.stop="handleRemoveColor(i)"
        >
          <UIcon name="i-lucide-x" class="size-3" />
        </button>
      </div>
      <!-- Add color button -->
      <button
        type="button"
        class="size-9 lg:size-7 rounded-full border-2 border-dashed border-gray-100 dark:border-gray-500 flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-500 transition-colors"
        @click="handleAddColor"
      >
        <UIcon name="i-lucide-plus" class="size-4" />
      </button>
    </div>
    <p v-else class="text-sm text-gray-500">
      Upload an image to see palette
    </p>

    <!-- Color Editor (when editing) -->
    <div v-if="editingIndex !== null && editingColor" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
      <UColorPicker
        :model-value="pickerHex"
        size="sm"
        @update:model-value="(val: string | undefined) => { if (val) { pickerHex = val; hexInput = val } }"
      />
      <div class="flex items-center gap-2">
        <UInput
          v-model="hexInput"
          size="sm"
          class="flex-1 font-mono"
          @keyup.enter="commitHex"
        />
        <UButton
          label="Done"
          color="primary"
          size="sm"
          @click="commitHex"
        />
      </div>
    </div>

    <!-- Preset Selector -->
    <span class="text-xs font-medium uppercase tracking-wide text-muted">Presets</span>
    <USelect
      :model-value="selectedPreset"
      :items="presetOptions"
      class="w-full"
      @update:model-value="handlePresetChange"
    />

    <!-- Analysis method selector (original palette only) -->
    <div v-if="selectedPreset === 'original'" class="space-y-1">
      <HelpTooltip>
        <template #label>
          <span class="text-xs text-gray-500 dark:text-gray-400">Color selection method</span>
        </template>
        <template #help>
          <p class="mb-2">
            How colors are picked from the image.
          </p>
          <dl class="space-y-1.5">
            <div
              v-for="algo in PALETTE_ALGORITHMS"
              :key="algo.value"
            >
              <dt class="font-medium">
                {{ algo.label }}
              </dt>
              <dd class="text-muted">
                {{ algo.description }}
              </dd>
            </div>
          </dl>
        </template>
        <USelect
          :model-value="paletteAlgorithm"
          :items="paletteAlgorithmOptions"
          class="mt-1 w-full"
          @update:model-value="(v) => emit('update:paletteAlgorithm', v as PaletteAlgorithm)"
        />
      </HelpTooltip>
    </div>

    <!-- Color count selector (original palette only) -->
    <div v-if="selectedPreset === 'original'" class="space-y-1">
      <span class="text-xs text-gray-500 dark:text-gray-400">Number of colors</span>
      <div class="flex items-center gap-2">
        <UInputNumber
          v-model="colorCountInput"
          :min="2"
          :max="32"
          class="flex-1"
          @keydown.enter="applyColorCount"
        />
        <UButton
          icon="i-lucide-check"
          :color="isColorCountDirty ? 'primary' : 'neutral'"
          :variant="isColorCountDirty ? 'solid' : 'soft'"
          aria-label="Apply color count"
          :disabled="!isColorCountDirty"
          @click="applyColorCount"
        />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <UButton
        label="Save"
        size="sm"
        :variant="activeTab === 'save' ? 'solid' : 'ghost'"
        color="neutral"
        @click="toggleTab('save')"
      />
      <UButton
        label="Export"
        size="sm"
        :variant="activeTab === 'export' ? 'solid' : 'ghost'"
        color="neutral"
        @click="toggleTab('export')"
      />
      <UButton
        label="Import"
        size="sm"
        :variant="activeTab === 'import' ? 'solid' : 'ghost'"
        color="neutral"
        @click="toggleTab('import')"
      />
      <UButton
        v-if="isCustomPaletteSelected"
        icon="i-lucide-trash-2"
        size="sm"
        variant="ghost"
        color="error"
        aria-label="Delete palette"
        @click="handleDeleteCurrent"
      />
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab" class="p-2 border border-dashed border-gray-100 dark:border-gray-500 rounded-lg">
      <!-- Save Tab -->
      <div v-if="activeTab === 'save'" class="space-y-2">
        <UInput
          v-model="newPaletteName"
          placeholder="Enter palette name"
          size="sm"
          @keyup.enter="handleSave"
        />
        <UButton
          label="Save"
          size="sm"
          color="primary"
          :disabled="!newPaletteName.trim()"
          @click="handleSave"
        />
      </div>

      <!-- Export Tab -->
      <div v-if="activeTab === 'export'" class="space-y-2">
        <UTextarea
          :model-value="exportJson"
          readonly
          :rows="4"
          class="font-mono text-xs"
        />
        <UButton
          label="Download"
          icon="i-lucide-download"
          size="sm"
          color="primary"
          @click="downloadExport"
        />
      </div>

      <!-- Import Tab -->
      <div v-if="activeTab === 'import'" class="space-y-2">
        <UTextarea
          v-model="importJson"
          placeholder='Paste palette JSON, e.g. [{"hex":"#ffffff"},{"hex":"#000000"}]'
          :rows="4"
          class="font-mono text-xs"
        />
        <UButton
          label="Import"
          size="sm"
          color="primary"
          :disabled="!importJson.trim()"
          @click="handleImport"
        />
      </div>
    </div>
  </div>
</template>
