import type { BayerSize, KnollPattern } from '~/utils/dithering'
import { DEFAULT_PALETTE_ALGORITHM, extractPalette, type PaletteAlgorithm } from '~/utils/palette-analysis'
import { addPixelation, bayerDither, blueNoiseDither, dizzyDither, kernelDiffusionDither, knollPatternDither, riemersmaDither, simple2DDither } from '~/utils/dithering'

// Returns a 24-bit RGB color (0xRRGGBB) guaranteed not to appear in the given palette.
// Used to designate the GIF transparent color index without conflicting with dithered pixels.
function findTransparentColor(palette: number[][]): number {
  const used = new Set(palette.map(c => ((c[0] ?? 0) << 16) | ((c[1] ?? 0) << 8) | (c[2] ?? 0)))
  for (const candidate of [0x00FF00, 0xFF00FF, 0x00FFFF, 0x010203, 0xFEFDFC, 0xABCDEF]) {
    if (!used.has(candidate)) return candidate
  }
  for (let c = 1; c <= 0xFFFFFF; c++) {
    if (!used.has(c)) return c
  }
  return 0
}

export type ColorSpace = 'rgb' | 'oklab'

export interface GifFrame {
  imageData: ImageData
  delay: number // milliseconds
}

// gif.js worker blob URL (created once, reused)
let gifWorkerUrl: string | null = null
async function getGifWorkerUrl(): Promise<string> {
  if (!gifWorkerUrl) {
    // Import worker source as a raw string via Vite, then create a Blob URL so gif.js can spawn it
    const workerSrc = await import('gif.js/dist/gif.worker.js?raw')
    const blob = new Blob([workerSrc.default], { type: 'application/javascript' })
    gifWorkerUrl = URL.createObjectURL(blob)
  }
  return gifWorkerUrl
}

export type DitherMode = 'diffusion' | 'bayer' | 'pattern' | 'blue-noise' | 'riemersma'

export const DIFFUSION_ALGORITHMS = [
  { label: 'Floyd-Steinberg', value: 'FloydSteinberg' },
  { label: 'Atkinson', value: 'Atkinson' },
  { label: 'Jarvis-Judice-Ninke', value: 'JarvisJudiceNinke' },
  { label: 'Stucki', value: 'Stucki' },
  { label: 'Burkes', value: 'Burkes' },
  { label: 'Sierra3', value: 'Sierra3' },
  { label: 'Sierra2', value: 'Sierra2' },
  { label: 'Sierra24A', value: 'Sierra24A' },
  { label: 'Fan', value: 'Fan' },
  { label: 'ShiauFan', value: 'ShiauFan' },
  { label: 'ShiauFan2', value: 'ShiauFan2' },
  { label: 'Simple 2D', value: 'Simple2D' },
  { label: 'Dizzy', value: 'Dizzy' }
] as const

export interface DitherResult {
  width: number
  height: number
  blob: Blob
  url: string
}

// Image element cache — avoids re-decoding data URLs on every dither
const imageCache = new Map<string, HTMLImageElement>()

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src)
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(src, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export function evictImageCache(src: string) {
  imageCache.delete(src)
}

// Module-level state — shared across all callers
const isProcessing = ref(false)
const ditherMode = ref<DitherMode>('diffusion')
const algorithm = ref('FloydSteinberg')
const serpentine = ref(false)
const pixeliness = ref(1)
const pixelScale = ref(1)
const bayerSize = ref<BayerSize>(4)
const knollPattern = ref<KnollPattern>(8)
const smoothPixels = ref(false)
const pixelatedRendering = ref(false)
const palette = ref<number[][]>([])
const colorSpace = ref<ColorSpace>('rgb')
const originalWidth = ref(0)
const originalHeight = ref(0)
const sizeWidth = ref<number | undefined>(undefined)
const sizeValid = ref(true)
const analyzeColorCount = ref(8)
const paletteAlgorithm = ref<PaletteAlgorithm>(DEFAULT_PALETTE_ALGORITHM)
const autoApply = ref(true)

// Dither Web Worker (lazily created)
let worker: Worker | null = null

// The worker is considered stuck if it goes this long without reporting progress
const WORKER_IDLE_TIMEOUT_MS = 10_000

export function useDithering() {
  const toast = useToast()

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(
        new URL('~/utils/dither-worker', import.meta.url),
        { type: 'module' }
      )
    }
    return worker
  }

  // Plain copy of the palette: a Vue proxy can't be posted to the worker (DataCloneError),
  // and reading it through the proxy once per pixel is slow on the main thread too.
  function plainPalette(colors: number[][]): number[][] {
    return colors.map(c => [...c])
  }

  // Which worker mode handles the current settings, or null for main-thread-only algorithms
  function currentWorkerMode(): string | null {
    if (ditherMode.value !== 'diffusion') return ditherMode.value
    if (algorithm.value === 'Simple2D' || algorithm.value === 'Dizzy') return null
    return 'diffusion'
  }

  function ditherInWorker(
    mode: string,
    imageData: ImageData,
    paletteToUse: number[][],
    onProgress?: (v: number) => void
  ): Promise<ImageData> {
    const { width, height } = imageData
    return new Promise((resolve, reject) => {
      const w = getWorker()
      let timeoutId: ReturnType<typeof setTimeout>
      const armTimeout = () => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          // Kill the stuck job so it doesn't hold up the next message
          w.terminate()
          if (worker === w) worker = null
          reject(new Error('Dither worker timeout'))
        }, WORKER_IDLE_TIMEOUT_MS)
      }
      armTimeout()
      w.onmessage = (e) => {
        if (e.data.type === 'progress') {
          armTimeout()
          onProgress?.(e.data.value)
          return
        }
        clearTimeout(timeoutId)
        resolve(new ImageData(new Uint8ClampedArray(e.data.pixels), e.data.width, e.data.height))
      }
      w.onerror = (e) => {
        clearTimeout(timeoutId)
        reject(e)
      }
      const msg: Record<string, unknown> = {
        mode,
        pixels: imageData.data.buffer,
        width,
        height,
        palette: paletteToUse,
        blockSize: pixeliness.value,
        colorSpace: colorSpace.value,
        algorithm: algorithm.value,
        serpentine: serpentine.value
      }
      if (mode === 'bayer') msg.bayerSize = bayerSize.value
      if (mode === 'pattern') msg.knollPattern = knollPattern.value
      w.postMessage(msg, [imageData.data.buffer])
    })
  }

  // Main-thread dither of the ctx's current contents. Pixelation is applied separately by the
  // callers after upscaling, so blockSize is always 1 here.
  function ditherOnMainThread(ctx: CanvasRenderingContext2D, width: number, height: number, paletteToUse: number[][]) {
    const imageData = ctx.getImageData(0, 0, width, height)
    if (ditherMode.value === 'bayer') {
      bayerDither(ctx, imageData, paletteToUse, 1, bayerSize.value, smoothPixels.value)
    } else if (ditherMode.value === 'pattern') {
      knollPatternDither(ctx, imageData, paletteToUse, 1, knollPattern.value, smoothPixels.value)
    } else if (ditherMode.value === 'blue-noise') {
      blueNoiseDither(ctx, imageData, paletteToUse, 1, smoothPixels.value)
    } else if (ditherMode.value === 'riemersma') {
      riemersmaDither(ctx, imageData, paletteToUse, 1, colorSpace.value, smoothPixels.value)
    } else if (algorithm.value === 'Simple2D') {
      simple2DDither(ctx, imageData, paletteToUse, 1, colorSpace.value, smoothPixels.value)
    } else if (algorithm.value === 'Dizzy') {
      dizzyDither(ctx, imageData, paletteToUse, 1, colorSpace.value, smoothPixels.value)
    } else {
      kernelDiffusionDither(ctx, imageData, paletteToUse, 1, algorithm.value, serpentine.value, colorSpace.value, smoothPixels.value)
    }
  }

  async function analyzePalette(
    source: HTMLImageElement | HTMLCanvasElement,
    count = analyzeColorCount.value
  ): Promise<number[][]> {
    return extractPalette(source, count, paletteAlgorithm.value)
  }

  function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob(blob => resolve(blob!), 'image/png')
    })
  }

  async function dither(
    sourceImage: HTMLImageElement,
    targetCanvas: HTMLCanvasElement,
    width?: number,
    onProgress?: (v: number) => void
  ): Promise<DitherResult> {
    isProcessing.value = true

    try {
      const ctx = targetCanvas.getContext('2d')!
      const finalWidth = width || sourceImage.naturalWidth
      const finalHeight = (sourceImage.naturalHeight / sourceImage.naturalWidth) * finalWidth

      // Pre-dither downscale for chunky pixel effect
      const scale = pixelScale.value
      const ditherWidth = scale > 1 ? Math.max(1, Math.round(finalWidth / scale)) : finalWidth
      const ditherHeight = scale > 1 ? Math.max(1, Math.round(finalHeight / scale)) : finalHeight

      targetCanvas.width = ditherWidth
      targetCanvas.height = ditherHeight
      ctx.drawImage(sourceImage, 0, 0, ditherWidth, ditherHeight)

      const paletteToUse = plainPalette(palette.value.length > 0 ? palette.value : await analyzePalette(sourceImage))
      const workerMode = currentWorkerMode()

      if (workerMode) {
        // --- Offload to Web Worker, with main-thread fallback ---
        try {
          const imageData = ctx.getImageData(0, 0, ditherWidth, ditherHeight)
          ctx.putImageData(await ditherInWorker(workerMode, imageData, paletteToUse, onProgress), 0, 0)
        } catch (err) {
          const isTimeout = err instanceof Error && err.message === 'Dither worker timeout'
          if (isTimeout) {
            toast.add({
              title: 'Processing on main thread',
              description: 'Worker timed out — this may slow the UI briefly',
              color: 'warning'
            })
          }
          ctx.drawImage(sourceImage, 0, 0, ditherWidth, ditherHeight)
          ditherOnMainThread(ctx, ditherWidth, ditherHeight, paletteToUse)
        }
      } else {
        // --- Simple 2D / Dizzy: main thread only ---
        ditherOnMainThread(ctx, ditherWidth, ditherHeight, paletteToUse)
      }

      // Upscale dithered result to full resolution with nearest-neighbor interpolation
      if (scale > 1) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = ditherWidth
        tempCanvas.height = ditherHeight
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.drawImage(targetCanvas, 0, 0)

        targetCanvas.width = finalWidth
        targetCanvas.height = finalHeight
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(tempCanvas, 0, 0, finalWidth, finalHeight)
      }

      // Post-process pixelation (operates on upscaled result)
      if (pixeliness.value > 1) {
        addPixelation(ctx, targetCanvas, finalWidth, finalHeight, pixeliness.value, smoothPixels.value)
      }

      // Async PNG encoding — doesn't block the main thread
      const blob = await canvasToBlob(targetCanvas)
      const url = URL.createObjectURL(blob)

      return {
        width: finalWidth,
        height: finalHeight,
        blob,
        url
      }
    } finally {
      isProcessing.value = false
    }
  }

  async function ditherGif(
    frames: GifFrame[],
    onProgress?: (progress: number) => void,
    targetWidth?: number
  ): Promise<DitherResult> {
    isProcessing.value = true
    try {
      const firstFrame = frames[0]!
      const srcWidth = firstFrame.imageData.width
      const srcHeight = firstFrame.imageData.height

      // Resolve final output dimensions (respecting user-set width)
      const finalWidth = targetWidth || srcWidth
      const finalHeight = Math.round((srcHeight / srcWidth) * finalWidth)

      // Pre-dither downscale for chunky pixel effect (mirrors `dither` logic)
      const scale = pixelScale.value
      const ditherWidth = scale > 1 ? Math.max(1, Math.round(finalWidth / scale)) : finalWidth
      const ditherHeight = scale > 1 ? Math.max(1, Math.round(finalHeight / scale)) : finalHeight

      // sourceCanvas holds the original-size frame so we can drawImage to scale it
      const sourceCanvas = document.createElement('canvas')
      sourceCanvas.width = srcWidth
      sourceCanvas.height = srcHeight
      const sourceCtx = sourceCanvas.getContext('2d')!

      const scratchCanvas = document.createElement('canvas')
      scratchCanvas.width = ditherWidth
      scratchCanvas.height = ditherHeight
      const ctx = scratchCanvas.getContext('2d')!

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const GIF = ((await import('gif.js')) as any).default
      const workerScript = await getGifWorkerUrl()
      // globalPalette: true makes gif.js build its color table once (from the first frame) and
      // reuse it for every subsequent frame. Without this, each frame gets its own independently
      // computed NeuQuant palette with its own transparent-color index — technically valid GIF89a,
      // but many real-world decoders only honor the *global* color table + its transparent index
      // and don't re-read each frame's local table, so only the first frame renders as transparent.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gif = new GIF({ workers: 2, quality: 10, workerScript, width: finalWidth, height: finalHeight, globalPalette: true }) as any

      // Scale the first frame into the scratch canvas for palette sampling
      sourceCtx.putImageData(firstFrame.imageData, 0, 0)
      ctx.drawImage(sourceCanvas, 0, 0, ditherWidth, ditherHeight)

      // Use the configured palette, or derive one from the first frame if none is set
      let paletteToUse = palette.value
      if (paletteToUse.length === 0) {
        paletteToUse = await analyzePalette(scratchCanvas, 8)
      }
      paletteToUse = plainPalette(paletteToUse)
      const workerMode = currentWorkerMode()

      // Only enable transparency encoding if the GIF actually has transparent pixels.
      // gif.js designates its closest palette entry to the transparent color — so setting it
      // unconditionally would corrupt fully-opaque GIFs by making some palette color transparent.
      const hasTransparency = frames.some(({ imageData }) => {
        const d = imageData.data
        for (let i = 3; i < d.length; i += 4) { if (d[i] === 0) return true }
        return false
      })
      let tR = 0, tG = 0, tB = 0
      if (hasTransparency) {
        const transparentColor = findTransparentColor(paletteToUse)
        gif.setOption('transparent', transparentColor)
        tR = (transparentColor >> 16) & 0xFF
        tG = (transparentColor >> 8) & 0xFF
        tB = transparentColor & 0xFF
      }

      // Output canvas — upscaled to finalWidth/finalHeight when pixelScale > 1
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = finalWidth
      outputCanvas.height = finalHeight
      const outputCtx = outputCanvas.getContext('2d')!

      for (let i = 0; i < frames.length; i++) {
        const { imageData, delay } = frames[i]!

        // Scale frame to dither dimensions — clear first so transparent pixels don't bleed from previous frames
        ctx.clearRect(0, 0, ditherWidth, ditherHeight)
        sourceCtx.putImageData(imageData, 0, 0)
        ctx.drawImage(sourceCanvas, 0, 0, ditherWidth, ditherHeight)

        if (workerMode) {
          try {
            const scaledImageData = ctx.getImageData(0, 0, ditherWidth, ditherHeight)
            ctx.putImageData(await ditherInWorker(workerMode, scaledImageData, paletteToUse), 0, 0)
          } catch {
            // Worker failed — fall back to main-thread dithering for this frame
            ctx.clearRect(0, 0, ditherWidth, ditherHeight)
            sourceCtx.putImageData(imageData, 0, 0)
            ctx.drawImage(sourceCanvas, 0, 0, ditherWidth, ditherHeight)
            ditherOnMainThread(ctx, ditherWidth, ditherHeight, paletteToUse)
          }
        } else {
          ditherOnMainThread(ctx, ditherWidth, ditherHeight, paletteToUse)
        }

        // Upscale dithered result to final dimensions with nearest-neighbor interpolation
        outputCtx.clearRect(0, 0, finalWidth, finalHeight)
        outputCtx.imageSmoothingEnabled = false
        outputCtx.drawImage(scratchCanvas, 0, 0, finalWidth, finalHeight)

        const ditheredData = outputCtx.getImageData(0, 0, finalWidth, finalHeight)

        // Replace transparent pixels with the designated transparent color (only when the GIF has transparency).
        if (hasTransparency) {
          const d = ditheredData.data
          for (let px = 0; px < d.length; px += 4) {
            if (d[px + 3] === 0) {
              d[px] = tR; d[px + 1] = tG; d[px + 2] = tB; d[px + 3] = 255
            }
          }
        }

        gif.addFrame(ditheredData, { delay })

        onProgress?.((i + 1) / frames.length)

        // Yield to the browser every 5 frames to keep the UI responsive
        if (i % 5 === 4) {
          await new Promise(resolve => requestAnimationFrame(resolve))
        }
      }

      const blob = await new Promise<Blob>((resolve) => {
        gif.on('finished', resolve)
        gif.render()
      })
      const url = URL.createObjectURL(blob)
      return { width: finalWidth, height: finalHeight, blob, url }
    } finally {
      isProcessing.value = false
    }
  }

  return {
    // State
    isProcessing,
    ditherMode,
    algorithm,
    serpentine,
    pixeliness,
    pixelScale,
    bayerSize,
    knollPattern,
    smoothPixels,
    pixelatedRendering,
    palette,
    colorSpace,
    originalWidth,
    originalHeight,
    sizeWidth,
    sizeValid,
    autoApply,
    analyzeColorCount,
    paletteAlgorithm,

    // Methods
    analyzePalette,
    dither,
    ditherGif
  }
}
