<script setup lang="ts">
// Import the web component (it touches HTMLElement, so only in the browser)
if (import.meta.client) import('img-comparison-slider')

const props = defineProps<{
  originalSrc: string
  ditheredSrc: string
  alt?: string
  imageStyle?: Record<string, string>
  // Restart both animations together (for animated GIFs while compare is visible)
  syncAnimation?: boolean
}>()

// Browsers animate each GIF <img> on its own clock, starting when it loads, so the two
// sides drift apart. Re-setting the same src doesn't restart a GIF, so load both into fresh
// object URLs, wait until both are decoded, then swap them in on the same tick.
const syncedUrls = ref<{ original: string, dithered: string } | null>(null)
let syncToken = 0

const shownOriginalSrc = computed(() => (props.syncAnimation && syncedUrls.value?.original) || props.originalSrc)
const shownDitheredSrc = computed(() => (props.syncAnimation && syncedUrls.value?.dithered) || props.ditheredSrc)

async function freshObjectUrl(src: string): Promise<string> {
  const blob = await (await fetch(src)).blob()
  const url = URL.createObjectURL(blob)
  const img = new Image()
  img.src = url
  await img.decode()
  return url
}

function revokeSyncedUrls() {
  if (syncedUrls.value) {
    URL.revokeObjectURL(syncedUrls.value.original)
    URL.revokeObjectURL(syncedUrls.value.dithered)
    syncedUrls.value = null
  }
}

async function restartTogether() {
  const token = ++syncToken
  try {
    const [original, dithered] = await Promise.all([freshObjectUrl(props.originalSrc), freshObjectUrl(props.ditheredSrc)])
    if (token !== syncToken) {
      URL.revokeObjectURL(original)
      URL.revokeObjectURL(dithered)
      return
    }
    revokeSyncedUrls()
    syncedUrls.value = { original, dithered }
  } catch {
    // Fall back to the unsynced sources
  }
}

watch(
  [() => props.syncAnimation, () => props.originalSrc, () => props.ditheredSrc],
  ([sync]) => {
    if (sync) {
      restartTogether()
    } else {
      syncToken++
      revokeSyncedUrls()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  syncToken++
  revokeSyncedUrls()
})

// The slider only clips the first (original) layer; the second sits full-width underneath.
// With transparent images — especially animated GIFs whose frames don't line up — the
// dithered layer would show through the original, so clip it to its own side as well.
const exposure = ref(50)

function onSlide(event: Event) {
  exposure.value = (event.target as HTMLElement & { value: number }).value
}
</script>

<template>
  <div class="image-compare-wrapper">
    <img-comparison-slider
      class="image-compare-slider"
      :value="exposure"
      @slide="onSlide"
    >
      <div slot="first" class="compare-slot">
        <img
          :src="shownOriginalSrc"
          :alt="alt ? `Original: ${alt}` : 'Original image'"
          class="compare-image"
          :style="imageStyle"
        />
      </div>
      <div
        slot="second"
        class="compare-slot"
        :style="{ clipPath: `inset(0 0 0 ${exposure}%)` }"
      >
        <img
          :src="shownDitheredSrc"
          :alt="alt ? `Dithered: ${alt}` : 'Dithered image'"
          class="compare-image"
          :style="imageStyle"
        />
      </div>
    </img-comparison-slider>
  </div>
</template>

<style scoped>
.image-compare-wrapper {
  position: relative;
  display: block;
  line-height: 0;
}

.image-compare-slider {
  --divider-color: var(--ui-primary);
  --default-handle-color: var(--ui-primary);
  --default-handle-width: 50px;
  --divider-width: 3px;
  overflow: hidden;
  max-width: 100%;
  touch-action: none;
}

.compare-slot {
  line-height: 0;
}

.image-compare-slider:focus {
  outline: 3px solid var(--ui-primary);
  outline-offset: 2px;
}

.compare-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

@media (min-width: 1024px) {
  .compare-image {
    max-height: 60vh;
  }
}
</style>
