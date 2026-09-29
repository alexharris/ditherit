// Bayer/BlueNoise/Riemersma/kernel-diffusion dithering Web Worker
// Bayer/BlueNoise/Riemersma duplicate minimal logic from dithering.ts; diffusion imports its DOM-free core

import { BLUE_NOISE_TEXTURE } from './blue-noise-texture'
import { kernelDiffusePixels } from './dithering'

type BayerSize = 2 | 4 | 8 | 16
type WorkerMode = 'bayer' | 'blue-noise' | 'riemersma' | 'diffusion'
type ColorSpace = 'rgb' | 'oklab'

// Inlined OKLab math (Björn Ottosson, 2020) — no imports in workers
function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl)
  const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl)
  const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl)
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ]
}

function generateBayerIndex(size: number): number[][] {
  if (size === 2) return [[0, 2], [3, 1]]
  const half = size / 2
  const sub = generateBayerIndex(half)
  const m: number[][] = Array.from({ length: size }, () => new Array(size))
  for (let si = 0; si < half; si++) {
    for (let sj = 0; sj < half; sj++) {
      const v = sub[si]![sj]! * 4
      m[si]![sj] = v
      m[si]![half + sj] = v + 2
      m[half + si]![sj] = v + 3
      m[half + si]![half + sj] = v + 1
    }
  }
  return m
}

function toBayerThresholds(m: number[][]): number[][] {
  const n = m.length * m.length
  return m.map(row => row.map(v => Math.floor((v + 0.5) / n * 256)))
}

const BAYER_MATRICES: Record<BayerSize, number[][]> = {
  2: toBayerThresholds(generateBayerIndex(2)),
  4: toBayerThresholds(generateBayerIndex(4)),
  8: toBayerThresholds(generateBayerIndex(8)),
  16: toBayerThresholds(generateBayerIndex(16))
}

// Palette entries are [index, r, g, b]
function getClosestColor(colors: number[][], r: number, g: number, b: number): number[] {
  let minDist = Infinity
  let closest: number[] = colors[0]!
  for (let i = 0; i < colors.length; i++) {
    const c = colors[i]!
    const dr = r - c[1]!
    const dg = g - c[2]!
    const db = b - c[3]!
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      closest = c
    }
  }
  return closest
}

function nextPowerOfTwo(n: number): number {
  let p = 1; while (p < n) p <<= 1; return p
}

function hilbertD2XY(n: number, d: number): [number, number] {
  let rx: number, ry: number, t = d, x = 0, y = 0
  for (let s = 1; s < n; s *= 2) {
    rx = 1 & Math.floor(t / 2)
    ry = 1 & (t ^ rx)
    if (ry === 0) {
      if (rx === 1) { x = s - 1 - x; y = s - 1 - y }
      const tmp = x; x = y; y = tmp
    }
    x += s * rx; y += s * ry; t = Math.floor(t / 4)
  }
  return [x, y]
}

function runBayer(data: Uint8ClampedArray, width: number, height: number, indexedPalette: number[][], bayerSize: BayerSize = 4, onProgress?: (v: number) => void) {
  const size = bayerSize
  const matrix = BAYER_MATRICES[size]
  const colorCache = new Map<number, number[]>()
  const reportEvery = Math.max(1, Math.floor(height / 10))

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 4
      const threshold = matrix[row % size]![col % size]!

      const r = Math.max(0, Math.min(255, data[i]! + 128 - threshold))
      const g = Math.max(0, Math.min(255, data[i + 1]! + 128 - threshold))
      const b = Math.max(0, Math.min(255, data[i + 2]! + 128 - threshold))

      const key = (r << 16) | (g << 8) | b
      let closest = colorCache.get(key)
      if (!closest) {
        closest = getClosestColor(indexedPalette, r, g, b)
        colorCache.set(key, closest)
      }

      data[i] = closest[1]!
      data[i + 1] = closest[2]!
      data[i + 2] = closest[3]!
    }
    if (onProgress && row % reportEvery === 0) {
      onProgress((row + 1) / height)
    }
  }
}

function runBlueNoise(data: Uint8ClampedArray, width: number, height: number, indexedPalette: number[][], onProgress?: (v: number) => void) {
  const colorCache = new Map<number, number[]>()
  const reportEvery = Math.max(1, Math.floor(height / 10))

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 4
      const threshold = BLUE_NOISE_TEXTURE[(row % 64) * 64 + (col % 64)]!

      const r = Math.max(0, Math.min(255, data[i]! + 128 - threshold))
      const g = Math.max(0, Math.min(255, data[i + 1]! + 128 - threshold))
      const b = Math.max(0, Math.min(255, data[i + 2]! + 128 - threshold))

      const key = (r << 16) | (g << 8) | b
      let closest = colorCache.get(key)
      if (!closest) {
        closest = getClosestColor(indexedPalette, r, g, b)
        colorCache.set(key, closest)
      }

      data[i] = closest[1]!
      data[i + 1] = closest[2]!
      data[i + 2] = closest[3]!
    }
    if (onProgress && row % reportEvery === 0) {
      onProgress((row + 1) / height)
    }
  }
}

function runRiemersma(data: Uint8ClampedArray, width: number, height: number, indexedPalette: number[][], colorSpace: ColorSpace = 'rgb', onProgress?: (v: number) => void) {
  const N = 32
  const r = 1 / 8
  const weights: number[] = []
  for (let i = 0; i < N; i++) {
    weights.push(Math.pow(r, i / (N - 1)))
  }

  const errorBuf = new Float64Array(N * 3)
  let bufHead = 0

  const side = nextPowerOfTwo(Math.max(width, height))
  const total = side * side
  const reportEvery = Math.max(1, Math.floor(total / 10))

  // palette entries are [index, r, g, b]
  const rawPalette = indexedPalette.map(c => [c[1]!, c[2]!, c[3]!] as [number, number, number])
  const paletteOklab = colorSpace === 'oklab' ? rawPalette.map(([pr, pg, pb]) => rgbToOklab(pr, pg, pb)) : null

  for (let d = 0; d < total; d++) {
    const [x, y] = hilbertD2XY(side, d)
    if (x >= width || y >= height) continue

    const i = (y * width + x) * 4

    let e0 = 0, e1 = 0, e2 = 0
    for (let k = 0; k < N; k++) {
      const slot = ((bufHead - 1 - k) % N + N) % N
      e0 += weights[k]! * errorBuf[slot * 3]!
      e1 += weights[k]! * errorBuf[slot * 3 + 1]!
      e2 += weights[k]! * errorBuf[slot * 3 + 2]!
    }

    if (colorSpace === 'oklab' && paletteOklab) {
      const [pixL, pixA, pixB] = rgbToOklab(data[i]!, data[i + 1]!, data[i + 2]!)
      const rawL = pixL + e0
      const rawA = pixA + e1
      const rawB = pixB + e2

      let minDist = Infinity
      let closestIdx = 0
      for (let p = 0; p < paletteOklab.length; p++) {
        const [pL, pA, pB] = paletteOklab[p]!
        const dL = rawL - pL!
        const dA = rawA - pA!
        const dB = rawB - pB!
        const dist = dL * dL + dA * dA + dB * dB
        if (dist < minDist) {
          minDist = dist
          closestIdx = p
        }
      }

      const [chosenR, chosenG, chosenB] = rawPalette[closestIdx]!
      data[i] = chosenR!
      data[i + 1] = chosenG!
      data[i + 2] = chosenB!

      // Store orig (not raw) minus chosen — raw includes accumulated error which
      // would create a feedback loop with w_0 = 1 in the weighted sum
      const [chosenL, chosenA, chosenBlab] = paletteOklab[closestIdx]!
      errorBuf[bufHead * 3] = pixL - chosenL!
      errorBuf[bufHead * 3 + 1] = pixA - chosenA!
      errorBuf[bufHead * 3 + 2] = pixB - chosenBlab!
    } else {
      const origR = data[i]!
      const origG = data[i + 1]!
      const origB = data[i + 2]!

      const adjR = Math.max(0, Math.min(255, origR + e0))
      const adjG = Math.max(0, Math.min(255, origG + e1))
      const adjB = Math.max(0, Math.min(255, origB + e2))

      const closest = getClosestColor(indexedPalette, adjR, adjG, adjB)
      const chosenR = closest[1]!
      const chosenG = closest[2]!
      const chosenB = closest[3]!

      data[i] = chosenR
      data[i + 1] = chosenG
      data[i + 2] = chosenB

      // Store orig (not adjusted) minus chosen — including accumulated error in
      // the stored value would create a feedback loop with w_0 = 1
      errorBuf[bufHead * 3] = origR - chosenR
      errorBuf[bufHead * 3 + 1] = origG - chosenG
      errorBuf[bufHead * 3 + 2] = origB - chosenB
    }

    bufHead = (bufHead + 1) % N

    if (onProgress && d % reportEvery === 0) {
      onProgress((d + 1) / total)
    }
  }
}

interface DitherMessage {
  mode: WorkerMode
  pixels: ArrayBuffer
  width: number
  height: number
  palette: number[][]
  blockSize: number
  bayerSize?: BayerSize
  colorSpace?: ColorSpace
  algorithm?: string
  serpentine?: boolean
}

self.onmessage = function (e: MessageEvent<DitherMessage>) {
  const { mode, pixels, width, height, palette, bayerSize, colorSpace, algorithm, serpentine } = e.data
  const data = new Uint8ClampedArray(pixels)
  const indexedPalette = palette.map((color: number[], id: number) => [id, ...color])
  const onProgress = (v: number) => self.postMessage({ type: 'progress', value: v })

  if (mode === 'bayer') {
    runBayer(data, width, height, indexedPalette, bayerSize ?? 4, onProgress)
  } else if (mode === 'blue-noise') {
    runBlueNoise(data, width, height, indexedPalette, onProgress)
  } else if (mode === 'riemersma') {
    runRiemersma(data, width, height, indexedPalette, colorSpace ?? 'rgb', onProgress)
  } else if (mode === 'diffusion') {
    kernelDiffusePixels(data, width, height, palette, algorithm ?? 'FloydSteinberg', serpentine ?? false, colorSpace ?? 'rgb', onProgress)
  }

  const transfer: Transferable[] = [data.buffer]
  self.postMessage({ type: 'done', pixels: data.buffer, width, height }, { transfer })
}
