<script setup lang="ts">
import type { GalleryImage } from '~/composables/useImageGallery'

const props = defineProps<{
  images: GalleryImage[]
  selectedId: string | undefined
  showAdd?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  remove: [id: string]
  add: []
}>()

const scrollContainer = ref<HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const isScrollable = ref(false)

function updateScrollState() {
  const el = scrollContainer.value
  if (!el) return
  isScrollable.value = el.scrollWidth > el.clientWidth
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

function scroll(direction: 'left' | 'right') {
  const el = scrollContainer.value
  if (!el) return
  el.scrollBy({ left: direction === 'left' ? -120 : 120, behavior: 'smooth' })
}

watch(() => props.images.length, () => {
  nextTick(updateScrollState)
})

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(updateScrollState)
  if (scrollContainer.value) {
    resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(scrollContainer.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="relative flex min-w-0 flex-1 items-center">
    <UButton
      v-if="isScrollable"
      v-show="canScrollLeft"
      icon="i-lucide-chevron-left"
      color="neutral"
      variant="ghost"
      size="sm"
      class="hidden lg:flex shrink-0"
      @click="scroll('left')"
    />
    <div
      ref="scrollContainer"
      class="flex min-w-0 flex-1 justify-center gap-2 overflow-x-auto scrollbar-hide"
      @scroll="updateScrollState"
    >
      <button
        v-for="image in images"
        :key="image.id"
        type="button"
        class="group relative shrink-0 appearance-none border-0 bg-transparent p-0"
        :aria-label="`Select ${image.fileName}`"
        :aria-pressed="selectedId === image.id"
        @click="emit('select', image.id)"
      >
        <img
          :src="image.originalSrc"
          :alt="image.fileName"
          class="h-14 w-auto rounded border-2 object-cover transition-all"
          :class="[
            selectedId === image.id
              ? 'border-ditherit shadow-sm shadow-black/30'
              : 'border-gray-100 hover:border-gray-500 dark:border-gray-800 dark:hover:border-gray-500'
          ]"
        />
        <!-- Processing indicator -->
        <div
          v-if="image.isProcessing"
          class="absolute inset-0 flex items-center justify-center rounded bg-black/50"
        >
          <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-ditherit" />
        </div>
        <!-- Animated GIF frame count badge -->
        <span
          v-if="image.isAnimatedGif && image.gifFrameCount"
          class="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-xs text-white"
        >{{ image.gifFrameCount }}f</span>
      </button>
      <button
        v-if="showAdd"
        type="button"
        class="size-10 shrink-0 self-center flex items-center justify-center rounded-full border-2 border-dashed border-gray-100 text-gray-500 transition-colors hover:border-ditherit hover:text-ditherit dark:border-gray-500 dark:hover:border-ditherit"
        aria-label="Add image"
        @click="emit('add')"
      >
        <UIcon name="i-lucide-plus" class="size-5" />
      </button>
    </div>
    <UButton
      v-if="isScrollable"
      v-show="canScrollRight"
      icon="i-lucide-chevron-right"
      color="neutral"
      variant="ghost"
      size="sm"
      class="hidden lg:flex shrink-0"
      @click="scroll('right')"
    />
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
