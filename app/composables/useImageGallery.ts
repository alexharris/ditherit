import JSZip from 'jszip'
import { nextTick } from 'vue'

export interface GifFrame {
  imageData: ImageData
  delay: number // milliseconds
}

export interface GalleryImage {
  id: string
  fileName: string
  originalSrc: string
  originalFileSize: number // in bytes
  originalMimeType: string // e.g. 'image/jpeg', 'image/png'
  naturalWidth: number
  naturalHeight: number
  ditheredDataUrl: string | null // blob URL for display
  ditheredBlob: Blob | null // raw PNG/GIF blob for download/zip
  ditheredFileSize: number | null // blob.size in bytes
  resizedOriginalSrc: string | null
  isProcessing: boolean
  isStale: boolean // dithered result is outdated and needs re-processing
  isAnimatedGif: boolean
  gifFrames: GifFrame[] | null
  gifFrameCount: number | null
  processingProgress: number | null // 0–1 while dithering GIF frames
  wasDownscaled: boolean // shrunk to MAX_EDGE on upload
}

export interface DownscaledImage {
  name: string
  from: [number, number]
  to: [number, number]
}

export interface AddImagesResult {
  tooLarge: string[]
  failed: string[]
  downscaled: DownscaledImage[]
  largeFiles: string[]
  added: number
}

export const MAX_UPLOAD_MB = 100

// Module-level state — shared across all callers
const images = ref<GalleryImage[]>([])
const selectedId = ref<string | null>(null)
const isDownloadingAll = ref(false)
const addingCount = ref(0) // >0 while files are being decoded/downscaled
const isAddingImages = computed(() => addingCount.value > 0)

const selectedImage = computed(() =>
  images.value.find(img => img.id === selectedId.value) || null
)

const hasImages = computed(() => images.value.length > 0)

const processedCount = computed(() =>
  images.value.filter(img => img.ditheredDataUrl !== null).length
)

export function useImageGallery() {

  function generateId(): string {
    return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  const MAX_FILE_SIZE = MAX_UPLOAD_MB * 1024 * 1024 // guards against decode OOM
  const MAX_EDGE = 4096 // larger images are downscaled on upload

  function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read blob'))
      reader.readAsDataURL(blob)
    })
  }

  function loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = src
    })
  }

  // Downscale by repeated halving, then a final high-quality step to the target size.
  // Halving avoids the aliasing a single large drawImage downscale produces.
  async function downscaleImage(src: string, targetWidth: number, targetHeight: number, mimeType: string): Promise<string> {
    const img = await loadImageElement(src)
    let source: CanvasImageSource = img
    let w = img.naturalWidth
    let h = img.naturalHeight

    while (w / 2 >= targetWidth * 2 && h / 2 >= targetHeight * 2) {
      w = Math.round(w / 2)
      h = Math.round(h / 2)
      const step = document.createElement('canvas')
      step.width = w
      step.height = h
      const stepCtx = step.getContext('2d')!
      stepCtx.imageSmoothingQuality = 'high'
      stepCtx.drawImage(source, 0, 0, w, h)
      source = step
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

    const isJpeg = mimeType === 'image/jpeg'
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Failed to encode image')),
        isJpeg ? 'image/jpeg' : 'image/png',
        isJpeg ? 0.92 : undefined
      )
    })
    return blobToDataURL(blob)
  }

  async function decodeGifFrames(file: File, scale = 1): Promise<GifFrame[] | null> {
    try {
      const { parseGIF, decompressFrames } = await import('gifuct-js')
      const buffer = await readFileAsArrayBuffer(file)
      const gif = parseGIF(buffer)
      const frames = decompressFrames(gif, true)
      if (frames.length <= 1) return null

      const fullWidth = gif.lsd.width
      const fullHeight = gif.lsd.height

      // Compositing canvas — accumulates frames respecting disposal methods
      const canvas = document.createElement('canvas')
      canvas.width = fullWidth
      canvas.height = fullHeight
      const ctx = canvas.getContext('2d')!

      // Output canvas — composited frames are drawn here at the scaled size.
      // Compositing itself stays at full resolution so disposal methods work unchanged.
      const outWidth = Math.max(1, Math.round(fullWidth * scale))
      const outHeight = Math.max(1, Math.round(fullHeight * scale))
      const outCanvas = scale < 1 ? document.createElement('canvas') : null
      const outCtx = outCanvas?.getContext('2d') ?? null
      if (outCanvas && outCtx) {
        outCanvas.width = outWidth
        outCanvas.height = outHeight
        outCtx.imageSmoothingQuality = 'high'
      }

      const result: GifFrame[] = []
      let previousSnapshot: ImageData | null = null

      for (const frame of frames) {
        // Save snapshot before drawing if we need to restore it next iteration
        if (frame.disposalType === 3) {
          previousSnapshot = ctx.getImageData(0, 0, fullWidth, fullHeight)
        }

        // Draw the patch at its position within the full canvas
        const patchCanvas = document.createElement('canvas')
        patchCanvas.width = frame.dims.width
        patchCanvas.height = frame.dims.height
        const patchCtx = patchCanvas.getContext('2d')!
        patchCtx.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), frame.dims.width, frame.dims.height), 0, 0)
        ctx.drawImage(patchCanvas, frame.dims.left, frame.dims.top)

        // Capture the fully composited frame
        let imageData: ImageData
        if (outCanvas && outCtx) {
          outCtx.clearRect(0, 0, outWidth, outHeight)
          outCtx.drawImage(canvas, 0, 0, outWidth, outHeight)
          imageData = outCtx.getImageData(0, 0, outWidth, outHeight)
        } else {
          imageData = ctx.getImageData(0, 0, fullWidth, fullHeight)
        }
        result.push({
          imageData,
          delay: frame.delay // gifuct-js already returns ms
        })

        // Apply disposal method for the next frame
        switch (frame.disposalType) {
          case 2:
            // Restore to background. Real browsers render this as "clear to transparent"
            // regardless of the GIF's declared background color index — that index isn't
            // reliable here since each frame can carry its own local color table with a
            // different transparent index, making cross-frame index comparisons meaningless.
            ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height)
            break
          case 3:
            if (previousSnapshot) ctx.putImageData(previousSnapshot, 0, 0)
            break
          // 0/1: leave canvas as-is
        }
      }

      return result
    } catch {
      return null
    }
  }

  function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = src
    })
  }

  async function addImages(files: FileList | File[]): Promise<AddImagesResult> {
    addingCount.value++
    try {
      // Let the loading indicator paint before decoding blocks the main thread
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return await addImagesInner(files)
    } finally {
      addingCount.value--
    }
  }

  async function addImagesInner(files: FileList | File[]): Promise<AddImagesResult> {
    const isMobile = import.meta.client && window.innerWidth < 1024
    const LARGE_FILE_THRESHOLD = isMobile ? 1 * 1024 * 1024 : 2 * 1024 * 1024
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'))
    const tooLarge: string[] = []
    const failed: string[] = []
    const downscaled: DownscaledImage[] = []
    const largeFiles: string[] = []
    let added = 0

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        tooLarge.push(file.name)
        continue
      }

      let dataUrl: string
      let width: number
      let height: number
      let isAnimatedGif = false
      let gifFrames: GifFrame[] | null = null
      let gifFrameCount: number | null = null
      let wasDownscaled = false

      // Object URL avoids building a huge base64 string just to read dimensions
      const objectUrl = URL.createObjectURL(file)
      try {
        const dims = await getImageDimensions(objectUrl)
        const longEdge = Math.max(dims.width, dims.height)
        const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1
        width = Math.max(1, Math.round(dims.width * scale))
        height = Math.max(1, Math.round(dims.height * scale))

        if (file.type === 'image/gif') {
          const frames = await decodeGifFrames(file, scale)
          if (frames) {
            isAnimatedGif = true
            gifFrames = frames
            gifFrameCount = frames.length
          }
        }

        if (scale < 1 && !isAnimatedGif) {
          dataUrl = await downscaleImage(objectUrl, width, height, file.type)
        } else {
          dataUrl = await readFileAsDataURL(file)
        }

        if (scale < 1) {
          wasDownscaled = true
          downscaled.push({ name: file.name, from: [dims.width, dims.height], to: [width, height] })
        }
      } catch {
        // Decode can fail for very large images (e.g. iOS Safari memory limits)
        failed.push(file.name)
        continue
      } finally {
        URL.revokeObjectURL(objectUrl)
      }

      const newImage: GalleryImage = {
        id: generateId(),
        fileName: file.name,
        originalSrc: dataUrl,
        originalFileSize: file.size,
        originalMimeType: file.type || 'image/png',
        naturalWidth: width,
        naturalHeight: height,
        ditheredDataUrl: null,
        ditheredBlob: null,
        ditheredFileSize: null,
        resizedOriginalSrc: null,
        isProcessing: false,
        isStale: false,
        isAnimatedGif,
        gifFrames,
        gifFrameCount,
        processingProgress: null,
        wasDownscaled
      }
      images.value.push(newImage)

      if (!wasDownscaled && (file.size > LARGE_FILE_THRESHOLD || width * height > 4_000_000)) {
        largeFiles.push(file.name)
      }

      added++

      // Auto-select if this is the first image
      if (images.value.length === 1) {
        selectedId.value = newImage.id
      }
    }

    return { tooLarge, failed, downscaled, largeFiles, added }
  }

  async function addImageFromUrl(url: string, fileName: string) {
    const response = await fetch(url)
    const blob = await response.blob()
    const file = new File([blob], fileName, { type: blob.type })
    await addImages([file])
  }

  function selectImage(id: string) {
    selectedId.value = id
  }

  function removeImage(id: string) {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      // Revoke blob URL before removing
      const img = images.value[index]
      if (img?.ditheredDataUrl) {
        URL.revokeObjectURL(img.ditheredDataUrl)
      }

      images.value.splice(index, 1)

      // Update selection if we removed the selected image
      if (selectedId.value === id) {
        if (images.value.length > 0) {
          // Select the previous image, or first if we removed the first
          const newIndex = Math.max(0, index - 1)
          selectedId.value = images.value[newIndex]?.id ?? null
        } else {
          selectedId.value = null
        }
      }
    }
  }

  function clearAll() {
    // Revoke all blob URLs
    images.value.forEach((img) => {
      if (img.ditheredDataUrl) {
        URL.revokeObjectURL(img.ditheredDataUrl)
      }
    })
    images.value = []
    selectedId.value = null
  }

  function setDitheredResult(id: string, url: string, blob: Blob) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      const oldUrl = image.ditheredDataUrl
      // Set new values first so the <img> gets a valid src immediately
      image.ditheredDataUrl = url
      image.ditheredBlob = blob
      image.ditheredFileSize = blob.size
      image.isStale = false
      // Revoke old blob URL after Vue has flushed the DOM update
      if (oldUrl) {
        nextTick(() => URL.revokeObjectURL(oldUrl))
      }
    }
  }

  function setResizedOriginal(id: string, dataUrl: string | null) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      image.resizedOriginalSrc = dataUrl
    }
  }

  function setProcessing(id: string, processing: boolean) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      image.isProcessing = processing
    }
  }

  function setProgress(id: string, value: number | null) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      image.processingProgress = value
    }
  }

  function clearDitheredResults() {
    images.value.forEach((img) => {
      if (img.ditheredDataUrl) {
        URL.revokeObjectURL(img.ditheredDataUrl)
      }
      img.ditheredDataUrl = null
      img.ditheredBlob = null
      img.ditheredFileSize = null
      img.resizedOriginalSrc = null
      img.processingProgress = null
    })
  }

  async function downloadAll(
    processImage: (image: GalleryImage) => Promise<{ url: string; blob: Blob }>,
    format: string = 'png',
    convertBlob?: (blob: Blob) => Promise<Blob>
  ) {
    if (images.value.length === 0) return

    isDownloadingAll.value = true

    try {
      const zip = new JSZip()

      // Process any unprocessed images and add all to ZIP
      for (const image of images.value) {
        let blob = image.ditheredBlob

        // Process if not already processed
        if (!blob) {
          image.isProcessing = true
          try {
            const result = await processImage(image)
            // Revoke old URL if any
            if (image.ditheredDataUrl) {
              URL.revokeObjectURL(image.ditheredDataUrl)
            }
            image.ditheredDataUrl = result.url
            image.ditheredBlob = result.blob
            image.ditheredFileSize = result.blob.size
            blob = result.blob
          } finally {
            image.isProcessing = false
          }
        }

        if (blob) {
          const baseName = image.fileName.replace(/\.[^.]+$/, '')
          if (image.isAnimatedGif) {
            // Always use .gif extension and skip format conversion for animated GIFs
            zip.file(`${baseName}-dithered.gif`, blob)
          } else {
            if (convertBlob) {
              blob = await convertBlob(blob)
            }
            zip.file(`${baseName}-dithered.${format}`, blob)
          }
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'dithered-images.zip'
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      isDownloadingAll.value = false
    }
  }

  return {
    // State
    images,
    selectedId,
    selectedImage,
    hasImages,
    processedCount,
    isDownloadingAll,
    isAddingImages,

    // Methods
    addImages,
    addImageFromUrl,
    selectImage,
    removeImage,
    clearAll,
    setDitheredResult,
    setResizedOriginal,
    setProcessing,
    setProgress,
    clearDitheredResults,
    downloadAll
  }
}
