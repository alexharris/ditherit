import { oklabToRgb, rgbToOklab } from './oklab'

// Palette analysis: picks N representative colors from an image.
//
// Every algorithm works on the same pre-computed color histogram, so adding one means writing a
// `PaletteQuantizer` and registering it in PALETTE_ALGORITHMS — sampling, sorting and the UI are shared.

// Longest side of the downscaled copy the histogram is built from. Plenty for picking a palette,
// and keeps analysis fast regardless of the source resolution.
const SAMPLE_MAX_SIDE = 256

// Pixels at or below this alpha are ignored (transparent areas shouldn't claim palette slots)
const ALPHA_THRESHOLD = 127

/** One histogram bucket: the average color of all sampled pixels that fell into it. */
export interface ColorBin {
  r: number
  g: number
  b: number
  count: number
}

/** Takes the image's color histogram and returns up to `count` RGB colors. */
export type PaletteQuantizer = (bins: ColorBin[], count: number) => number[][]

// --- Sampling ---

// Groups pixels into 5-bit-per-channel buckets (32³), averaging the exact colors within each
export function buildHistogram(data: Uint8ClampedArray): ColorBin[] {
  const size = 1 << 15
  const counts = new Uint32Array(size)
  const sumR = new Float64Array(size)
  const sumG = new Float64Array(size)
  const sumB = new Float64Array(size)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! <= ALPHA_THRESHOLD) continue
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
    counts[key]!++
    sumR[key]! += r
    sumG[key]! += g
    sumB[key]! += b
  }

  const bins: ColorBin[] = []
  for (let key = 0; key < size; key++) {
    const count = counts[key]!
    if (count === 0) continue
    bins.push({ r: sumR[key]! / count, g: sumG[key]! / count, b: sumB[key]! / count, count })
  }
  return bins
}

function samplePixels(source: HTMLImageElement | HTMLCanvasElement): Uint8ClampedArray {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height
  const scale = Math.min(1, SAMPLE_MAX_SIDE / Math.max(srcW, srcH))
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(source, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

// --- Helpers ---

type Lab = [number, number, number]

function binToLab(bin: ColorBin): Lab {
  return rgbToOklab(bin.r, bin.g, bin.b)
}

function labDistSq(a: Lab, b: Lab): number {
  const dL = a[0] - b[0]
  const da = a[1] - b[1]
  const db = a[2] - b[2]
  return dL * dL + da * da + db * db
}

function roundRgb(r: number, g: number, b: number): number[] {
  return [Math.round(r), Math.round(g), Math.round(b)]
}

// --- Algorithms ---

// Median cut: repeatedly splits the color box with the highest weighted variance along its widest
// channel, at the weighted median. Fast and deterministic; favors large color areas.
export const medianCut: PaletteQuantizer = (bins, count) => {
  interface Box { bins: ColorBin[], score: number, channel: 'r' | 'g' | 'b' }

  function makeBox(boxBins: ColorBin[]): Box {
    let total = 0
    const mean = { r: 0, g: 0, b: 0 }
    for (const bin of boxBins) {
      total += bin.count
      mean.r += bin.r * bin.count
      mean.g += bin.g * bin.count
      mean.b += bin.b * bin.count
    }
    mean.r /= total
    mean.g /= total
    mean.b /= total

    const variance = { r: 0, g: 0, b: 0 }
    for (const bin of boxBins) {
      variance.r += (bin.r - mean.r) ** 2 * bin.count
      variance.g += (bin.g - mean.g) ** 2 * bin.count
      variance.b += (bin.b - mean.b) ** 2 * bin.count
    }
    const channel = variance.r >= variance.g && variance.r >= variance.b
      ? 'r'
      : variance.g >= variance.b ? 'g' : 'b'
    const score = boxBins.length > 1 ? variance.r + variance.g + variance.b : 0
    return { bins: boxBins, score, channel }
  }

  const boxes: Box[] = [makeBox(bins)]
  while (boxes.length < count) {
    let target = 0
    for (let i = 1; i < boxes.length; i++) {
      if (boxes[i]!.score > boxes[target]!.score) target = i
    }
    const box = boxes[target]!
    if (box.score === 0) break // nothing left to split

    const ch = box.channel
    const sorted = [...box.bins].sort((a, b) => a[ch] - b[ch])
    const half = sorted.reduce((sum, bin) => sum + bin.count, 0) / 2
    let acc = 0
    let split = 1
    for (let i = 0; i < sorted.length - 1; i++) {
      acc += sorted[i]!.count
      split = i + 1
      if (acc >= half) break
    }
    boxes.splice(target, 1, makeBox(sorted.slice(0, split)), makeBox(sorted.slice(split)))
  }

  return boxes.map((box) => {
    let total = 0, r = 0, g = 0, b = 0
    for (const bin of box.bins) {
      total += bin.count
      r += bin.r * bin.count
      g += bin.g * bin.count
      b += bin.b * bin.count
    }
    return roundRgb(r / total, g / total, b / total)
  })
}

// K-means in OKLab, seeded from median cut so results are deterministic. Refining in a perceptual
// space keeps colors that look distinct, even when they cover a small part of the image.
const KMEANS_ITERATIONS = 12

export const kMeansOklab: PaletteQuantizer = (bins, count) => {
  const labs = bins.map(binToLab)
  const centers: Lab[] = medianCut(bins, count).map(([r, g, b]) => rgbToOklab(r!, g!, b!))
  const k = centers.length
  const assignment = new Int32Array(labs.length)

  for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
    let changed = false
    for (let i = 0; i < labs.length; i++) {
      let best = 0
      let bestDist = Infinity
      for (let c = 0; c < k; c++) {
        const d = labDistSq(labs[i]!, centers[c]!)
        if (d < bestDist) {
          bestDist = d
          best = c
        }
      }
      if (assignment[i] !== best) {
        assignment[i] = best
        changed = true
      }
    }
    if (!changed && iter > 0) break

    const sums = Array.from({ length: k }, () => [0, 0, 0, 0])
    for (let i = 0; i < labs.length; i++) {
      const s = sums[assignment[i]!]!
      const w = bins[i]!.count
      s[0]! += labs[i]![0] * w
      s[1]! += labs[i]![1] * w
      s[2]! += labs[i]![2] * w
      s[3]! += w
    }
    for (let c = 0; c < k; c++) {
      const s = sums[c]!
      // An empty cluster keeps its previous center
      if (s[3]! > 0) centers[c] = [s[0]! / s[3]!, s[1]! / s[3]!, s[2]! / s[3]!]
    }
  }

  return centers.map(([L, a, b]) => oklabToRgb(L, a, b))
}

// Popularity: the most frequent colors, skipping any too close (in OKLab) to one already picked.
// Keeps the image's exact dominant colors rather than averages — good for flat artwork and logos.
const POPULARITY_MIN_DIST = 0.08

export const popularity: PaletteQuantizer = (bins, count) => {
  const sorted = [...bins].sort((a, b) => b.count - a.count)
  const labs = sorted.map(binToLab)
  const picked: number[] = []

  // Relax the spacing until enough colors are found (or every bin is used)
  for (let minDist = POPULARITY_MIN_DIST; picked.length < count && picked.length < sorted.length; minDist /= 2) {
    const minDistSq = minDist * minDist
    for (let i = 0; i < sorted.length && picked.length < count; i++) {
      if (picked.includes(i)) continue
      if (picked.every(p => labDistSq(labs[i]!, labs[p]!) >= minDistSq)) picked.push(i)
    }
    if (minDist < 1e-4) break
  }

  return picked.map((i) => {
    const bin = sorted[i]!
    return roundRgb(bin.r, bin.g, bin.b)
  })
}

// --- Registry ---

export const PALETTE_ALGORITHMS = [
  { label: 'K-means', value: 'kmeans', description: 'Balanced, perceptually distinct colors', quantize: kMeansOklab },
  { label: 'Median cut', value: 'median-cut', description: 'Favors the largest color areas', quantize: medianCut },
  { label: 'Popularity', value: 'popularity', description: 'The image\'s exact most common colors', quantize: popularity }
] as const satisfies readonly { label: string, value: string, description: string, quantize: PaletteQuantizer }[]

export type PaletteAlgorithm = typeof PALETTE_ALGORITHMS[number]['value']

export const DEFAULT_PALETTE_ALGORITHM: PaletteAlgorithm = 'popularity'

/** Picks up to `count` colors from the histogram, deduplicated and sorted dark → light. */
export function quantizeBins(bins: ColorBin[], count: number, algorithm: PaletteAlgorithm): number[][] {
  if (bins.length === 0) return [[0, 0, 0], [255, 255, 255]]
  const entry = PALETTE_ALGORITHMS.find(a => a.value === algorithm)
    ?? PALETTE_ALGORITHMS.find(a => a.value === DEFAULT_PALETTE_ALGORITHM)!
  const colors = entry.quantize(bins, count)

  const seen = new Set<number>()
  const unique = colors.filter(([r, g, b]) => {
    const key = (r! << 16) | (g! << 8) | b!
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  return unique
    .map(c => ({ c, L: rgbToOklab(c[0]!, c[1]!, c[2]!)[0] }))
    .sort((a, b) => a.L - b.L)
    .map(({ c }) => c)
}

/** Analyzes an image or canvas and returns up to `count` RGB palette colors. */
export function extractPalette(
  source: HTMLImageElement | HTMLCanvasElement,
  count: number,
  algorithm: PaletteAlgorithm = DEFAULT_PALETTE_ALGORITHM
): number[][] {
  return quantizeBins(buildHistogram(samplePixels(source)), count, algorithm)
}
