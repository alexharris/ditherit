export interface PaletteColor {
  hex: string
}

export interface CustomPalette {
  name: string
  colors: PaletteColor[]
}

export interface PresetPalette {
  name: string
  value: string
  colors: PaletteColor[]
}

const STORAGE_KEY = 'ditherit_custom_palettes'

export const PRESET_PALETTES: PresetPalette[] = [
  {
    name: 'Black & White',
    value: 'blackwhite',
    colors: [{ hex: '#ffffff' }, { hex: '#000000' }]
  },
  {
    name: 'Red Monochrome',
    value: 'redmono',
    colors: [{ hex: '#ffe3db' }, { hex: '#4f1403' }]
  },
  {
    name: 'Green Monochrome',
    value: 'greenmono',
    colors: [{ hex: '#eeffdb' }, { hex: '#1d3801' }]
  },
  {
    name: 'Blue Monochrome',
    value: 'bluemono',
    colors: [{ hex: '#dbf9ff' }, { hex: '#02474f' }]
  },
  {
    name: 'Yellow Monochrome',
    value: 'yellowmono',
    colors: [{ hex: '#fffedb' }, { hex: '#303001' }]
  },
  {
    name: 'Red',
    value: 'red',
    colors: [
      { hex: '#ffffff' },
      { hex: '#f46842' },
      { hex: '#aa2f0d' },
      { hex: '#000000' }
    ]
  },
  {
    name: 'Green',
    value: 'green',
    colors: [
      { hex: '#ffffff' },
      { hex: '#c4f441' },
      { hex: '#6da90c' },
      { hex: '#000000' }
    ]
  },
  {
    name: 'Blue',
    value: 'blue',
    colors: [
      { hex: '#ffffff' },
      { hex: '#41e2f4' },
      { hex: '#0c9fa9' },
      { hex: '#000000' }
    ]
  },
  {
    name: 'Yellow',
    value: 'yellow',
    colors: [
      { hex: '#ffffff' },
      { hex: '#f4eb41' },
      { hex: '#a9a40c' },
      { hex: '#000000' }
    ]
  },
  {
    name: 'CMYK',
    value: 'cmyk',
    colors: [
      { hex: '#000000' },
      { hex: '#ffff00' },
      { hex: '#00FFFF' },
      { hex: '#FF00FF' },
      { hex: '#FFFFFF' }
    ]
  },
  {
    name: 'RGBY',
    value: 'rgby',
    colors: [
      { hex: '#FF0000' },
      { hex: '#00FF00' },
      { hex: '#0000FF' },
      { hex: '#FFFF00' }
    ]
  },
  {
    name: 'Game Boy DMG-01',
    value: 'gameboy',
    colors: [
      { hex: '#CADC9F' },
      { hex: '#0F380F' },
      { hex: '#306230' },
      { hex: '#8BAC0F' },
      { hex: '#9BBC0F' }
    ]
  },
  {
    name: 'Purple & Green',
    value: 'purplegreen',
    colors: [{ hex: '#76C066' }, { hex: '#AD2BBB' }]
  },
  {
    name: 'Yellow & Red',
    value: 'yellowred',
    colors: [{ hex: '#FFEE2C' }, { hex: '#E20023' }]
  },
  {
    name: 'Blue & Yellow',
    value: 'blueyellow',
    colors: [{ hex: '#134E87' }, { hex: '#FFF585' }]
  },
  {
    name: 'Black White Red',
    value: 'bwr',
    colors: [{ hex: '#FFFFFF' }, { hex: '#000000' }, { hex: '#FF0000' }]
  }
]

// Module-level state — shared across all callers
const paletteColors = ref<PaletteColor[]>([{ hex: '#ffffff' }, { hex: '#000000' }])
const originalPalette = ref<PaletteColor[]>([])
const customPalettes = ref<CustomPalette[]>([])
const selectedPreset = ref<string>('original')
const editingColorIndex = ref<number | null>(null)

// Module-level computed — shared across all callers
const isCustomSelected = computed(() => selectedPreset.value === 'custom')
const isCustomPaletteSelected = computed(() => selectedPreset.value.startsWith('custom-'))

export function usePalette() {

  const paletteAsRgb = computed(() => {
    return paletteColors.value.map(c => hexToRgb(c.hex)).filter((c): c is number[] => c !== null)
  })

  const exportJson = computed(() => {
    return JSON.stringify(paletteColors.value, null, 2)
  })

  // Methods
  function hexToRgb(hex: string): number[] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result || !result[1] || !result[2] || !result[3]) return null
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
  }

  function rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  function setPaletteFromRgb(rgbPalette: number[][]) {
    const colors = rgbPalette.map((rgb) => {
      const r = rgb[0] ?? 0
      const g = rgb[1] ?? 0
      const b = rgb[2] ?? 0
      return { hex: rgbToHex(r, g, b) }
    })
    paletteColors.value = colors
    originalPalette.value = [...colors]
  }

  function updateOriginalPalette(rgbPalette: number[][]) {
    originalPalette.value = rgbPalette.map((rgb) => {
      const r = rgb[0] ?? 0
      const g = rgb[1] ?? 0
      const b = rgb[2] ?? 0
      return { hex: rgbToHex(r, g, b) }
    })
  }

  function setColorAt(index: number, hex: string) {
    if (index >= 0 && index < paletteColors.value.length) {
      paletteColors.value[index] = { hex }
      selectedPreset.value = 'custom'
    }
  }

  function addColor(hex: string = '#ffffff') {
    paletteColors.value.push({ hex })
    selectedPreset.value = 'custom'
  }

  function removeColor(index: number) {
    if (paletteColors.value.length > 2 && index >= 0 && index < paletteColors.value.length) {
      paletteColors.value.splice(index, 1)
      selectedPreset.value = 'custom'
    }
  }

  // Loads an arbitrary palette (e.g. from a shared link) as an unsaved custom palette
  function setCustomPalette(hexes: string[]) {
    paletteColors.value = hexes.map(hex => ({ hex }))
    selectedPreset.value = 'custom'
  }

  function selectPreset(value: string) {
    selectedPreset.value = value

    if (value === 'original') {
      paletteColors.value = [...originalPalette.value]
    } else if (value.startsWith('custom-')) {
      const index = parseInt(value.replace('custom-', ''))
      if (customPalettes.value[index]) {
        paletteColors.value = [...customPalettes.value[index].colors]
      }
    } else {
      const preset = PRESET_PALETTES.find(p => p.value === value)
      if (preset) {
        paletteColors.value = [...preset.colors]
      }
    }
  }

  function loadCustomPalettes() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          customPalettes.value = JSON.parse(stored)
        } catch {
          customPalettes.value = []
        }
      }
    }
  }

  function saveCustomPalettes() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPalettes.value))
    }
  }

  function saveCurrentPalette(name: string) {
    if (!name.trim()) return false

    const newPalette: CustomPalette = {
      name: name.trim(),
      colors: JSON.parse(JSON.stringify(paletteColors.value))
    }

    customPalettes.value.push(newPalette)
    saveCustomPalettes()

    selectedPreset.value = `custom-${customPalettes.value.length - 1}`
    return true
  }

  function deleteCustomPalette(index: number) {
    if (index >= 0 && index < customPalettes.value.length) {
      customPalettes.value.splice(index, 1)
      saveCustomPalettes()

      // Reset to original
      selectedPreset.value = 'original'
      paletteColors.value = [...originalPalette.value]
    }
  }

  function importFromJson(json: string): boolean {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) return false

      // Validate structure
      const valid = parsed.every(
        (c: unknown) =>
          typeof c === 'object' &&
          c !== null &&
          'hex' in c &&
          typeof (c as PaletteColor).hex === 'string'
      )
      if (!valid) return false

      paletteColors.value = parsed as PaletteColor[]
      selectedPreset.value = 'custom'
      return true
    } catch {
      return false
    }
  }

  // Initialize
  onMounted(() => {
    loadCustomPalettes()
  })

  return {
    // State
    paletteColors,
    originalPalette,
    customPalettes,
    selectedPreset,
    editingColorIndex,

    // Computed
    isCustomSelected,
    isCustomPaletteSelected,
    paletteAsRgb,
    exportJson,

    // Methods
    hexToRgb,
    rgbToHex,
    setPaletteFromRgb,
    updateOriginalPalette,
    setColorAt,
    addColor,
    removeColor,
    selectPreset,
    setCustomPalette,
    loadCustomPalettes,
    saveCurrentPalette,
    deleteCustomPalette,
    importFromJson
  }
}
