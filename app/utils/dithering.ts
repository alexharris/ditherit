import { BLUE_NOISE_TEXTURE } from './blue-noise-texture'
import { rgbToOklab } from './oklab'

export type BayerSize = 2 | 4 | 8 | 16

export const BAYER_SIZES = [
  { label: '2x2', value: 2 },
  { label: '4x4', value: 4 },
  { label: '8x8', value: 8 },
  { label: '16x16', value: 16 }
] as const

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

export const BAYER_MATRICES: Record<BayerSize, number[][]> = {
  2: toBayerThresholds(generateBayerIndex(2)),
  4: toBayerThresholds(generateBayerIndex(4)),
  8: toBayerThresholds(generateBayerIndex(8)),
  16: toBayerThresholds(generateBayerIndex(16))
}

// Error diffusion kernels: each entry is [weight, dx, dy]
export const DIFFUSION_KERNELS: Record<string, Array<[number, number, number]>> = {
  FloydSteinberg: [[7 / 16, 1, 0], [3 / 16, -1, 1], [5 / 16, 0, 1], [1 / 16, 1, 1]],
  Atkinson: [[1 / 8, 1, 0], [1 / 8, 2, 0], [1 / 8, -1, 1], [1 / 8, 0, 1], [1 / 8, 1, 1], [1 / 8, 0, 2]],
  JarvisJudiceNinke: [[7 / 48, 1, 0], [5 / 48, 2, 0], [3 / 48, -2, 1], [5 / 48, -1, 1], [7 / 48, 0, 1], [5 / 48, 1, 1], [3 / 48, 2, 1], [1 / 48, -2, 2], [3 / 48, -1, 2], [5 / 48, 0, 2], [3 / 48, 1, 2], [1 / 48, 2, 2]],
  Stucki: [[8 / 42, 1, 0], [4 / 42, 2, 0], [2 / 42, -2, 1], [4 / 42, -1, 1], [8 / 42, 0, 1], [4 / 42, 1, 1], [2 / 42, 2, 1], [1 / 42, -2, 2], [2 / 42, -1, 2], [4 / 42, 0, 2], [2 / 42, 1, 2], [1 / 42, 2, 2]],
  Burkes: [[8 / 32, 1, 0], [4 / 32, 2, 0], [2 / 32, -2, 1], [4 / 32, -1, 1], [8 / 32, 0, 1], [4 / 32, 1, 1], [2 / 32, 2, 1]],
  Sierra3: [[5 / 32, 1, 0], [3 / 32, 2, 0], [2 / 32, -2, 1], [4 / 32, -1, 1], [5 / 32, 0, 1], [4 / 32, 1, 1], [2 / 32, 2, 1], [2 / 32, -1, 2], [3 / 32, 0, 2], [2 / 32, 1, 2]],
  Sierra2: [[4 / 16, 1, 0], [3 / 16, 2, 0], [1 / 16, -2, 1], [2 / 16, -1, 1], [3 / 16, 0, 1], [2 / 16, 1, 1], [1 / 16, 2, 1]],
  Sierra24A: [[2 / 4, 1, 0], [1 / 4, -1, 1], [1 / 4, 0, 1]],
  Fan: [[7 / 16, 1, 0], [1 / 16, -2, 1], [3 / 16, -1, 1], [5 / 16, 0, 1]],
  ShiauFan: [[4 / 8, 1, 0], [1 / 8, -2, 1], [1 / 8, -1, 1], [2 / 8, 0, 1]],
  ShiauFan2: [[8 / 16, 1, 0], [1 / 16, -3, 1], [1 / 16, -2, 1], [2 / 16, -1, 1], [4 / 16, 0, 1]]
}

// Error diffusion must bound the error it carries: when a region's color is outside what the
// palette can mix, the leftover error otherwise grows without limit and later bleeds into
// neighbouring areas as blobs of the wrong color. RGB clamps the adjusted value to 0–255.
// OKLab caps the accumulated error instead: clamping to the sRGB gamut would also cut off the
// legitimate out-of-gamut compensation OKLab relies on (e.g. a large cyan error that stops a
// red palette color from tinting a gray area).
const OKLAB_MAX_ERROR = 0.75

function capOklabError(e: number): number {
  return Math.max(-OKLAB_MAX_ERROR, Math.min(OKLAB_MAX_ERROR, e))
}

export function getClosestColor(colors: number[][], [r2, g2, b2]: number[]): number[] {
  let minDist = Infinity
  let closest = colors[0]
  for (let i = 0; i < colors.length; i++) {
    const [, r1, g1, b1] = colors[i]
    const dist = (r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2
    if (dist < minDist) {
      minDist = dist
      closest = colors[i]
    }
  }
  return closest
}

export function addPixelation(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  blockSize: number,
  smoothDownscale = false
) {
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCanvas.width = width / blockSize
  tempCanvas.height = height / blockSize

  tempCtx.imageSmoothingEnabled = smoothDownscale
  tempCtx.drawImage(sourceCanvas, 0, 0, tempCanvas.width, tempCanvas.height)

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    tempCanvas,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height,
    0,
    0,
    width,
    height
  )
}

export function bayerDither(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  palette: number[][],
  blockSize: number,
  bayerSize: BayerSize = 4,
  smoothDownscale = false
) {
  const matrix = BAYER_MATRICES[bayerSize]
  const size = bayerSize

  const imageDataLength = imageData.data.length
  const w = imageData.width

  const newPalette = palette.map((color, id) => [id, ...color])

  for (let currentPixel = 0; currentPixel <= imageDataLength - 4; currentPixel += 4) {
    const x = (currentPixel / 4) % w
    const y = Math.floor(currentPixel / 4 / w)

    const threshold = matrix[y % size]![x % size]!

    const map = Math.max(0, Math.min(255, imageData.data[currentPixel]! + 128 - threshold))
    const map2 = Math.max(0, Math.min(255, imageData.data[currentPixel + 1]! + 128 - threshold))
    const map3 = Math.max(0, Math.min(255, imageData.data[currentPixel + 2]! + 128 - threshold))

    const closestColor = getClosestColor(newPalette, [map, map2, map3])

    imageData.data[currentPixel] = closestColor[1]!
    imageData.data[currentPixel + 1] = closestColor[2]!
    imageData.data[currentPixel + 2] = closestColor[3]!
  }

  ctx.putImageData(imageData, 0, 0)

  if (blockSize > 1) {
    addPixelation(ctx, ctx.canvas, imageData.width, imageData.height, blockSize, smoothDownscale)
  }
}

// Kernel-based error diffusion dither (Floyd-Steinberg, Atkinson, etc.).
// Carried error is bounded (see OKLAB_MAX_ERROR). Fully transparent pixels are skipped:
// they are not quantized and don't spread error.
export function kernelDiffusionDither(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  palette: number[][],
  blockSize: number,
  kernelName: string,
  serpentine: boolean,
  colorSpace: 'rgb' | 'oklab',
  smoothDownscale = false
) {
  const { width, height } = imageData
  const data = imageData.data
  const kernel = DIFFUSION_KERNELS[kernelName] ?? DIFFUSION_KERNELS['FloydSteinberg']!

  if (colorSpace === 'oklab') {
    const paletteOklab = palette.map(([r, g, b]) => rgbToOklab(r!, g!, b!))

    const errL = new Float64Array(width * height)
    const errA = new Float64Array(width * height)
    const errB = new Float64Array(width * height)

    for (let y = 0; y < height; y++) {
      const forward = !serpentine || y % 2 === 0
      const xStart = forward ? 0 : width - 1
      const xEnd = forward ? width : -1
      const xStep = forward ? 1 : -1

      for (let x = xStart; x !== xEnd; x += xStep) {
        const i = (y * width + x) * 4
        const idx = y * width + x
        if (data[i + 3] === 0) continue

        const [pixL, pixA, pixB] = rgbToOklab(data[i]!, data[i + 1]!, data[i + 2]!)
        const rawL = pixL + capOklabError(errL[idx]!)
        const rawA = pixA + capOklabError(errA[idx]!)
        const rawB = pixB + capOklabError(errB[idx]!)

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

        const chosen = palette[closestIdx]!
        data[i] = chosen[0]!
        data[i + 1] = chosen[1]!
        data[i + 2] = chosen[2]!

        const [chosenL, chosenA, chosenBlab] = paletteOklab[closestIdx]!
        const eL = rawL - chosenL!
        const eA = rawA - chosenA!
        const eB = rawB - chosenBlab!

        for (const [weight, kdx, kdy] of kernel) {
          const nx = x + (forward ? kdx : -kdx)
          const ny = y + kdy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const nidx = ny * width + nx
          errL[nidx]! += eL * weight
          errA[nidx]! += eA * weight
          errB[nidx]! += eB * weight
        }
      }
    }
  } else {
    // RGB branch: Rec. 709 perceptual nearest-color, float error buffers
    const errR = new Float64Array(width * height)
    const errG = new Float64Array(width * height)
    const errBuf = new Float64Array(width * height)

    for (let y = 0; y < height; y++) {
      const forward = !serpentine || y % 2 === 0
      const xStart = forward ? 0 : width - 1
      const xEnd = forward ? width : -1
      const xStep = forward ? 1 : -1

      for (let x = xStart; x !== xEnd; x += xStep) {
        const i = (y * width + x) * 4
        const idx = y * width + x
        if (data[i + 3] === 0) continue

        const rawR = data[i]! + errR[idx]!
        const rawG = data[i + 1]! + errG[idx]!
        const rawB = data[i + 2]! + errBuf[idx]!

        const adjR = Math.max(0, Math.min(255, rawR))
        const adjG = Math.max(0, Math.min(255, rawG))
        const adjB = Math.max(0, Math.min(255, rawB))

        let minDist = Infinity
        let closestIdx = 0
        for (let p = 0; p < palette.length; p++) {
          const [pr, pg, pb] = palette[p]!
          const dr = adjR - pr!
          const dg = adjG - pg!
          const db = adjB - pb!
          const dist = 0.2126 * dr * dr + 0.7152 * dg * dg + 0.0722 * db * db
          if (dist < minDist) {
            minDist = dist
            closestIdx = p
          }
        }

        const chosen = palette[closestIdx]!
        data[i] = chosen[0]!
        data[i + 1] = chosen[1]!
        data[i + 2] = chosen[2]!

        const eR = adjR - chosen[0]!
        const eG = adjG - chosen[1]!
        const eB = adjB - chosen[2]!

        for (const [weight, kdx, kdy] of kernel) {
          const nx = x + (forward ? kdx : -kdx)
          const ny = y + kdy
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          const nidx = ny * width + nx
          errR[nidx]! += eR * weight
          errG[nidx]! += eG * weight
          errBuf[nidx]! += eB * weight
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  if (blockSize > 1) {
    addPixelation(ctx, ctx.canvas, width, height, blockSize, smoothDownscale)
  }
}

export function simple2DDither(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  palette: number[][],
  blockSize: number,
  colorSpace: 'rgb' | 'oklab' = 'rgb',
  smoothDownscale = false
) {
  const { width, height } = imageData
  const data = imageData.data

  if (colorSpace === 'oklab') {
    const paletteOklab = palette.map(([r, g, b]) => rgbToOklab(r!, g!, b!))

    const errL = new Float64Array(width * height)
    const errA = new Float64Array(width * height)
    const errB = new Float64Array(width * height)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const idx = y * width + x
        if (data[i + 3] === 0) continue

        const [pixL, pixA, pixB] = rgbToOklab(data[i]!, data[i + 1]!, data[i + 2]!)
        const rawL = pixL + capOklabError(errL[idx]!)
        const rawA = pixA + capOklabError(errA[idx]!)
        const rawB = pixB + capOklabError(errB[idx]!)

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

        const chosen = palette[closestIdx]!
        data[i] = chosen[0]!
        data[i + 1] = chosen[1]!
        data[i + 2] = chosen[2]!

        const [chosenL, chosenA, chosenBlab] = paletteOklab[closestIdx]!
        const eL = rawL - chosenL!
        const eA = rawA - chosenA!
        const eB = rawB - chosenBlab!

        if (x + 1 < width) {
          errL[idx + 1]! += eL * 0.5
          errA[idx + 1]! += eA * 0.5
          errB[idx + 1]! += eB * 0.5
        }
        if (y + 1 < height) {
          errL[idx + width]! += eL * 0.5
          errA[idx + width]! += eA * 0.5
          errB[idx + width]! += eB * 0.5
        }
      }
    }
  } else {
    // RGB branch — float error buffers; error is measured from the clamped value
    const newPalette = palette.map((color, id) => [id, ...color])

    const errR = new Float64Array(width * height)
    const errG = new Float64Array(width * height)
    const errB = new Float64Array(width * height)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const idx = y * width + x
        if (data[i + 3] === 0) continue

        const rawR = data[i]! + errR[idx]!
        const rawG = data[i + 1]! + errG[idx]!
        const rawB = data[i + 2]! + errB[idx]!

        const adjR = Math.max(0, Math.min(255, rawR))
        const adjG = Math.max(0, Math.min(255, rawG))
        const adjB = Math.max(0, Math.min(255, rawB))

        const closest = getClosestColor(newPalette, [adjR, adjG, adjB])
        const chosenR = closest[1]!
        const chosenG = closest[2]!
        const chosenB = closest[3]!

        data[i] = chosenR
        data[i + 1] = chosenG
        data[i + 2] = chosenB

        const eR = adjR - chosenR
        const eG = adjG - chosenG
        const eB = adjB - chosenB

        if (x + 1 < width) {
          errR[idx + 1]! += eR * 0.5
          errG[idx + 1]! += eG * 0.5
          errB[idx + 1]! += eB * 0.5
        }
        if (y + 1 < height) {
          errR[idx + width]! += eR * 0.5
          errG[idx + width]! += eG * 0.5
          errB[idx + width]! += eB * 0.5
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  if (blockSize > 1) {
    addPixelation(ctx, ctx.canvas, width, height, blockSize, smoothDownscale)
  }
}

// Seeded PRNG (mulberry32) — keeps the randomized iteration order reproducible
// across re-renders of the same image/settings, matching the other dither modes.
function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const DIZZY_SEED = 0x9E3779B9

// [weight, dx, dy] — orthogonal neighbors get 10x the weight of diagonal ones
const DIZZY_NEIGHBORS: Array<[number, number, number]> = [
  [10, 1, 0], [10, -1, 0], [10, 0, 1], [10, 0, -1],
  [1, 1, 1], [1, -1, 1], [1, 1, -1], [1, -1, -1]
]
const DIZZY_WEIGHT_SUM = DIZZY_NEIGHBORS.reduce((sum, [w]) => sum + w, 0)

// Dizzy dithering: error diffusion in randomized pixel order instead of a raster
// scan. Error only propagates to neighbors not yet visited, which — combined with
// the random order — avoids both Bayer's grid artifacts and Floyd-Steinberg's
// directional streaking, approaching blue-noise quality without a void-and-cluster
// texture. See https://liamappelbe.medium.com/dizzy-dithering-2ae76dbceba1
export function dizzyDither(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  palette: number[][],
  blockSize: number,
  colorSpace: 'rgb' | 'oklab' = 'rgb',
  smoothDownscale = false
) {
  const { width, height } = imageData
  const data = imageData.data
  const n = width * height

  const rand = mulberry32(DIZZY_SEED)
  const order = new Uint32Array(n)
  for (let i = 0; i < n; i++) order[i] = i
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = order[i]!
    order[i] = order[j]!
    order[j] = tmp
  }

  const processed = new Uint8Array(n)

  if (colorSpace === 'oklab') {
    const paletteOklab = palette.map(([r, g, b]) => rgbToOklab(r!, g!, b!))

    const valL = new Float64Array(n)
    const valA = new Float64Array(n)
    const valB = new Float64Array(n)
    for (let idx = 0; idx < n; idx++) {
      const i = idx * 4
      const [l, a, b] = rgbToOklab(data[i]!, data[i + 1]!, data[i + 2]!)
      valL[idx] = l
      valA[idx] = a
      valB[idx] = b
    }

    for (let k = 0; k < n; k++) {
      const idx = order[k]!
      const x = idx % width
      const y = (idx / width) | 0
      if (data[idx * 4 + 3] === 0) {
        processed[idx] = 1
        continue
      }

      const [pixL, pixA, pixB] = rgbToOklab(data[idx * 4]!, data[idx * 4 + 1]!, data[idx * 4 + 2]!)
      const rawL = pixL + capOklabError(valL[idx]! - pixL)
      const rawA = pixA + capOklabError(valA[idx]! - pixA)
      const rawB = pixB + capOklabError(valB[idx]! - pixB)

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

      const chosen = palette[closestIdx]!
      const i4 = idx * 4
      data[i4] = chosen[0]!
      data[i4 + 1] = chosen[1]!
      data[i4 + 2] = chosen[2]!

      const [chosenL, chosenA, chosenBlab] = paletteOklab[closestIdx]!
      const eL = rawL - chosenL!
      const eA = rawA - chosenA!
      const eB = rawB - chosenBlab!

      processed[idx] = 1

      for (const [weight, dx, dy] of DIZZY_NEIGHBORS) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const nidx = ny * width + nx
        if (processed[nidx]) continue
        const w = weight / DIZZY_WEIGHT_SUM
        valL[nidx]! += eL * w
        valA[nidx]! += eA * w
        valB[nidx]! += eB * w
      }
    }
  } else {
    const newPalette = palette.map((color, id) => [id, ...color])

    const valR = new Float64Array(n)
    const valG = new Float64Array(n)
    const valB = new Float64Array(n)
    for (let idx = 0; idx < n; idx++) {
      const i = idx * 4
      valR[idx] = data[i]!
      valG[idx] = data[i + 1]!
      valB[idx] = data[i + 2]!
    }

    for (let k = 0; k < n; k++) {
      const idx = order[k]!
      const x = idx % width
      const y = (idx / width) | 0
      if (data[idx * 4 + 3] === 0) {
        processed[idx] = 1
        continue
      }

      const rawR = valR[idx]!
      const rawG = valG[idx]!
      const rawB = valB[idx]!

      const adjR = Math.max(0, Math.min(255, rawR))
      const adjG = Math.max(0, Math.min(255, rawG))
      const adjB = Math.max(0, Math.min(255, rawB))

      const closest = getClosestColor(newPalette, [adjR, adjG, adjB])
      const chosenR = closest[1]!
      const chosenG = closest[2]!
      const chosenB = closest[3]!

      const i4 = idx * 4
      data[i4] = chosenR
      data[i4 + 1] = chosenG
      data[i4 + 2] = chosenB

      const eR = adjR - chosenR
      const eG = adjG - chosenG
      const eB = adjB - chosenB

      processed[idx] = 1

      for (const [weight, dx, dy] of DIZZY_NEIGHBORS) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const nidx = ny * width + nx
        if (processed[nidx]) continue
        const w = weight / DIZZY_WEIGHT_SUM
        valR[nidx]! += eR * w
        valG[nidx]! += eG * w
        valB[nidx]! += eB * w
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  if (blockSize > 1) {
    addPixelation(ctx, ctx.canvas, width, height, blockSize, smoothDownscale)
  }
}

function nextPowerOfTwo(n: number): number {
  let p = 1; while (p < n) p <<= 1; return p
}

export function hilbertD2XY(n: number, d: number): [number, number] {
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

export function blueNoiseDither(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  palette: number[][],
  blockSize: number,
  smoothDownscale = false
) {
  const imageDataLength = imageData.data.length
  const w = imageData.width

  const newPalette = palette.map((color, id) => [id, ...color])
  const colorCache = new Map<number, number[]>()

  for (let currentPixel = 0; currentPixel <= imageDataLength - 4; currentPixel += 4) {
    const x = (currentPixel / 4) % w
    const y = Math.floor(currentPixel / 4 / w)

    const threshold = BLUE_NOISE_TEXTURE[(y % 64) * 64 + (x % 64)]!

    const r = Math.max(0, Math.min(255, imageData.data[currentPixel]! + 128 - threshold))
    const g = Math.max(0, Math.min(255, imageData.data[currentPixel + 1]! + 128 - threshold))
    const b = Math.max(0, Math.min(255, imageData.data[currentPixel + 2]! + 128 - threshold))

    const key = (r << 16) | (g << 8) | b
    let closest = colorCache.get(key)
    if (!closest) {
      closest = getClosestColor(newPalette, [r, g, b])
      colorCache.set(key, closest)
    }

    imageData.data[currentPixel] = closest[1]!
    imageData.data[currentPixel + 1] = closest[2]!
    imageData.data[currentPixel + 2] = closest[3]!
  }

  ctx.putImageData(imageData, 0, 0)

  if (blockSize > 1) {
    addPixelation(ctx, ctx.canvas, imageData.width, imageData.height, blockSize, smoothDownscale)
  }
}

export function riemersmaDither(
  ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  palette: number[][],
  blockSize: number,
  colorSpace: 'rgb' | 'oklab' = 'rgb',
  smoothDownscale = false
) {
  const { width, height } = imageData
  const data = imageData.data

  const N = 32
  const r = 1 / 8
  const weights: number[] = []
  for (let i = 0; i < N; i++) {
    weights.push(Math.pow(r, i / (N - 1)))
  }

  const errorBuf: Float64Array = new Float64Array(N * 3)
  let bufHead = 0

  const side = nextPowerOfTwo(Math.max(width, height))

  if (colorSpace === 'oklab') {
    const paletteOklab = palette.map(([r, g, b]) => rgbToOklab(r!, g!, b!))

    for (let d = 0; d < side * side; d++) {
      const [x, y] = hilbertD2XY(side, d)
      if (x >= width || y >= height) continue

      const i = (y * width + x) * 4

      let eL = 0, eA = 0, eB = 0
      for (let k = 0; k < N; k++) {
        const slot = ((bufHead - 1 - k) % N + N) % N
        eL += weights[k]! * errorBuf[slot * 3]!
        eA += weights[k]! * errorBuf[slot * 3 + 1]!
        eB += weights[k]! * errorBuf[slot * 3 + 2]!
      }

      const [pixL, pixA, pixB] = rgbToOklab(data[i]!, data[i + 1]!, data[i + 2]!)
      const rawL = pixL + eL
      const rawA = pixA + eA
      const rawB = pixB + eB

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

      const chosen = palette[closestIdx]!
      data[i] = chosen[0]!
      data[i + 1] = chosen[1]!
      data[i + 2] = chosen[2]!

      // Store orig (not raw) minus chosen — raw includes accumulated error which
      // would create a feedback loop with w_0 = 1 in the weighted sum
      const [chosenL, chosenA, chosenBlab] = paletteOklab[closestIdx]!
      errorBuf[bufHead * 3] = pixL - chosenL!
      errorBuf[bufHead * 3 + 1] = pixA - chosenA!
      errorBuf[bufHead * 3 + 2] = pixB - chosenBlab!
      bufHead = (bufHead + 1) % N
    }
  } else {
    const newPalette = palette.map((color, id) => [id, ...color])

    for (let d = 0; d < side * side; d++) {
      const [x, y] = hilbertD2XY(side, d)
      if (x >= width || y >= height) continue

      const i = (y * width + x) * 4

      let eR = 0, eG = 0, eB = 0
      for (let k = 0; k < N; k++) {
        const slot = ((bufHead - 1 - k) % N + N) % N
        eR += weights[k]! * errorBuf[slot * 3]!
        eG += weights[k]! * errorBuf[slot * 3 + 1]!
        eB += weights[k]! * errorBuf[slot * 3 + 2]!
      }

      const origR = data[i]!
      const origG = data[i + 1]!
      const origB = data[i + 2]!

      const adjR = Math.max(0, Math.min(255, origR + eR))
      const adjG = Math.max(0, Math.min(255, origG + eG))
      const adjB = Math.max(0, Math.min(255, origB + eB))

      const closest = getClosestColor(newPalette, [adjR, adjG, adjB])
      const chosenR = closest[1]!
      const chosenG = closest[2]!
      const chosenB = closest[3]!

      data[i] = chosenR
      data[i + 1] = chosenG
      data[i + 2] = chosenB

      // Store orig (not raw) minus chosen — including accumulated error in the
      // stored value would create a feedback loop with w_0 = 1
      errorBuf[bufHead * 3] = origR - chosenR
      errorBuf[bufHead * 3 + 1] = origG - chosenG
      errorBuf[bufHead * 3 + 2] = origB - chosenB
      bufHead = (bufHead + 1) % N
    }
  }

  ctx.putImageData(imageData, 0, 0)

  if (blockSize > 1) {
    addPixelation(ctx, ctx.canvas, width, height, blockSize, smoothDownscale)
  }
}
