import type { LocationQuery } from 'vue-router'
import { DIFFUSION_ALGORITHMS, DITHER_MODES, type ColorSpace, type DitherMode } from '~/composables/useDithering'
import { PRESET_PALETTES } from '~/composables/usePalette'
import { BAYER_SIZES, KNOLL_PATTERNS, type BayerSize, type KnollPattern } from '~/utils/dithering'
import { DEFAULT_PALETTE_ALGORITHM, PALETTE_ALGORITHMS, type PaletteAlgorithm } from '~/utils/palette-analysis'

// Dither settings encoded as URL query params so a look can be shared or linked from a blog post.
// Only non-default values are written, and only the ones the current mode uses. The image itself
// never leaves the browser, so a link carries settings only.
//
//   ?mode=bayer&matrix=8&palette=gameboy&scale=3
//   ?mode=diffusion&algo=Atkinson&colors=0f380f-306230-8bac0f-9bbc0f

const DEFAULTS = {
  mode: 'diffusion' as DitherMode,
  algo: 'FloydSteinberg',
  serpentine: false,
  space: 'rgb' as ColorSpace,
  matrix: 4 as BayerSize,
  pattern: 8 as KnollPattern,
  scale: 1,
  pixelate: 1,
  smooth: false,
  sharp: false,
  count: 8,
  method: DEFAULT_PALETTE_ALGORITHM as PaletteAlgorithm
}

const SHARE_KEYS = ['mode', 'algo', 'serpentine', 'space', 'matrix', 'pattern', 'scale', 'pixelate', 'smooth', 'sharp', 'palette', 'colors', 'count', 'method']

const HEX_LIST = /^[0-9a-f]{6}(-[0-9a-f]{6}){1,31}$/i

function first(value: LocationQuery[string] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  return v ?? undefined
}

function intInRange(value: string | undefined, min: number, max: number): number | undefined {
  if (value === undefined || !/^\d+$/.test(value)) return undefined
  const n = parseInt(value, 10)
  return n >= min && n <= max ? n : undefined
}

export function useShareSettings() {
  const dithering = useDithering()
  const paletteState = usePalette()
  const gallery = useImageGallery()
  const toast = useToast()

  function buildQuery(): Record<string, string> {
    const q: Record<string, string> = {}
    const mode = dithering.ditherMode.value

    if (mode !== DEFAULTS.mode) q.mode = mode
    if (mode === 'diffusion') {
      if (dithering.algorithm.value !== DEFAULTS.algo) q.algo = dithering.algorithm.value
      if (dithering.serpentine.value) q.serpentine = '1'
    }
    if (dithering.colorSpace.value !== DEFAULTS.space) q.space = dithering.colorSpace.value
    if (mode === 'bayer' && dithering.bayerSize.value !== DEFAULTS.matrix) q.matrix = String(dithering.bayerSize.value)
    if (mode === 'pattern' && dithering.knollPattern.value !== DEFAULTS.pattern) q.pattern = String(dithering.knollPattern.value)

    if (dithering.pixelScale.value !== DEFAULTS.scale) q.scale = String(dithering.pixelScale.value)
    if (dithering.pixeliness.value !== DEFAULTS.pixelate) q.pixelate = String(dithering.pixeliness.value)
    if (dithering.smoothPixels.value) q.smooth = '1'
    if (dithering.pixelatedRendering.value) q.sharp = '1'

    const preset = paletteState.selectedPreset.value
    if (preset === 'original') {
      if (dithering.analyzeColorCount.value !== DEFAULTS.count) q.count = String(dithering.analyzeColorCount.value)
      if (dithering.paletteAlgorithm.value !== DEFAULTS.method) q.method = dithering.paletteAlgorithm.value
    } else if (PRESET_PALETTES.some(p => p.value === preset)) {
      q.palette = preset
    } else {
      // Edited or saved custom palette — saved names live in the sharer's localStorage, so send the colors
      q.colors = paletteState.paletteColors.value.map(c => c.hex.replace('#', '').toLowerCase()).join('-')
    }

    return q
  }

  function buildUrl(): string {
    const url = new URL(window.location.href)
    url.search = new URLSearchParams(buildQuery()).toString()
    url.hash = ''
    return url.toString()
  }

  function hasShareParams(query: LocationQuery): boolean {
    return SHARE_KEYS.some(k => k in query)
  }

  // Applies shared settings; missing or invalid params fall back to defaults
  function applyQuery(query: LocationQuery) {
    const get = (key: string) => first(query[key])

    const mode = get('mode')
    dithering.ditherMode.value = DITHER_MODES.some(m => m.value === mode) ? mode as DitherMode : DEFAULTS.mode

    const algo = get('algo')
    dithering.algorithm.value = DIFFUSION_ALGORITHMS.some(a => a.value === algo) ? algo! : DEFAULTS.algo
    dithering.serpentine.value = get('serpentine') === '1'
    dithering.colorSpace.value = get('space') === 'oklab' ? 'oklab' : DEFAULTS.space

    const matrix = Number(get('matrix'))
    dithering.bayerSize.value = BAYER_SIZES.some(b => b.value === matrix) ? matrix as BayerSize : DEFAULTS.matrix

    const patternParam = get('pattern')
    const pattern = KNOLL_PATTERNS.find(p => String(p.value) === patternParam)
    dithering.knollPattern.value = pattern ? pattern.value : DEFAULTS.pattern

    dithering.pixelScale.value = intInRange(get('scale'), 1, 25) ?? DEFAULTS.scale
    dithering.pixeliness.value = intInRange(get('pixelate'), 1, 25) ?? DEFAULTS.pixelate
    dithering.smoothPixels.value = get('smooth') === '1'
    dithering.pixelatedRendering.value = get('sharp') === '1'

    dithering.analyzeColorCount.value = intInRange(get('count'), 2, 32) ?? DEFAULTS.count
    const method = get('method')
    dithering.paletteAlgorithm.value = PALETTE_ALGORITHMS.some(a => a.value === method) ? method as PaletteAlgorithm : DEFAULTS.method

    const colors = get('colors')
    const palette = get('palette')
    if (colors && HEX_LIST.test(colors)) {
      paletteState.setCustomPalette(colors.split('-').map(hex => `#${hex.toLowerCase()}`))
    } else if (palette && PRESET_PALETTES.some(p => p.value === palette)) {
      paletteState.selectPreset(palette)
    } else {
      paletteState.selectPreset('original')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(buildUrl())
      toast.add({
        title: 'Settings link copied',
        description: 'Anyone who opens it gets these dither settings. Your image stays on your device.',
        icon: 'i-lucide-copy',
        color: 'success'
      })
    } catch {
      toast.add({ title: 'Could not copy link', description: buildUrl(), color: 'error' })
    }
  }

  // Plain-text dump for bug reports: every setting (not just the shareable non-defaults), the
  // selected image's properties and the browser. The filename is left out — it can be personal.
  function buildDebugInfo(): string {
    const d = dithering
    const img = gallery.selectedImage.value
    const onOff = (v: boolean) => v ? 'on' : 'off'
    const presetName = (() => {
      const preset = paletteState.selectedPreset.value
      if (preset === 'original') return 'Original (from image)'
      if (preset === 'custom') return 'Custom (edited)'
      if (preset.startsWith('custom-')) return 'Saved custom'
      return PRESET_PALETTES.find(p => p.value === preset)?.name ?? preset
    })()
    const colors = paletteState.paletteColors.value.map(c => c.hex)

    const lines = [
      'Dither it! debug info',
      `Settings link: ${buildUrl()}`,
      '',
      'Settings',
      `- Mode: ${DITHER_MODES.find(m => m.value === d.ditherMode.value)?.label ?? d.ditherMode.value}`,
      `- Diffusion algorithm: ${d.algorithm.value}, serpentine ${onOff(d.serpentine.value)}`,
      `- Color space: ${d.colorSpace.value}`,
      `- Bayer matrix: ${d.bayerSize.value}, Knoll pattern: ${d.knollPattern.value}`,
      `- Pixel scale: ${d.pixelScale.value}x, pixelate: ${d.pixeliness.value}x, smooth pixels ${onOff(d.smoothPixels.value)}`,
      `- Palette: ${presetName}, ${colors.length} colors: ${colors.join(' ')}`,
      `- Palette extraction: ${d.paletteAlgorithm.value}, ${d.analyzeColorCount.value} colors`,
      `- Output width: ${d.sizeWidth.value ?? 'original'}`,
      `- Pixelated rendering: ${onOff(d.pixelatedRendering.value)}`,
      `- Auto-dither ${onOff(d.autoApply.value)}, auto-downscale ${onOff(gallery.autoDownscale.value)}`,
      ''
    ]

    if (img) {
      lines.push(
        'Image',
        `- Format: ${img.originalMimeType}, ${(img.originalFileSize / 1024).toFixed(0)} KB`,
        `- Dimensions: ${img.naturalWidth} × ${img.naturalHeight}`
        + (img.wasDownscaled ? ` (downscaled from ${img.uploadWidth} × ${img.uploadHeight})` : ''),
        `- Animated GIF: ${img.isAnimatedGif ? `yes, ${img.gifFrameCount} frames` : 'no'}`,
        `- Dithered: ${img.ditheredBlob ? `${(img.ditheredBlob.size / 1024).toFixed(0)} KB${img.isStale ? ' (stale)' : ''}` : 'not yet'}`,
        `- Images loaded: ${gallery.images.value.length}`,
        ''
      )
    } else {
      lines.push('Image', '- None selected', '')
    }

    lines.push(
      'Environment',
      `- Browser: ${navigator.userAgent}`,
      `- Viewport: ${window.innerWidth} × ${window.innerHeight} @ ${window.devicePixelRatio}x`,
      `- Time: ${new Date().toISOString()}`
    )

    return lines.join('\n')
  }

  async function copyDebugInfo() {
    try {
      await navigator.clipboard.writeText(buildDebugInfo())
      toast.add({
        title: 'Debug info copied',
        description: 'Paste it into your bug report.',
        icon: 'i-lucide-clipboard-check',
        color: 'success'
      })
    } catch {
      toast.add({ title: 'Could not copy debug info', color: 'error' })
    }
  }

  return { buildQuery, buildUrl, hasShareParams, applyQuery, copyLink, buildDebugInfo, copyDebugInfo, SHARE_KEYS }
}
