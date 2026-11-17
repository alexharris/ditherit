<script setup lang="ts">
const props = defineProps<{
  originalWidth: number
  originalHeight: number
  initialWidth?: number
  autoApply?: boolean
}>()

const emit = defineEmits<{
  change: [payload: { width: number | undefined, valid: boolean }]
}>()

const MAX_WIDTH = 5000
const useCustomSize = ref(false)
const customWidth = ref(0)
const customWidthInput = ref(0)

const calculatedHeight = computed(() => {
  if (!props.originalWidth || !props.originalHeight) return 0
  const width = useCustomSize.value ? customWidth.value : props.originalWidth
  return Math.round((props.originalHeight / props.originalWidth) * width)
})

const isWidthValid = computed(() => {
  if (!useCustomSize.value) return true
  return customWidthInput.value > 0 && customWidthInput.value <= MAX_WIDTH
})

const isDirty = computed(() => useCustomSize.value && customWidthInput.value !== customWidth.value)

function enableCustomSize() {
  if (useCustomSize.value) return
  useCustomSize.value = true
  customWidth.value = props.originalWidth
  customWidthInput.value = props.originalWidth
}

function applySize() {
  if (!isWidthValid.value) return
  customWidth.value = customWidthInput.value
}

function resetToOriginalSize() {
  useCustomSize.value = false
  customWidth.value = props.originalWidth
  customWidthInput.value = props.originalWidth
}

// Reset when original dimensions change (new image selected)
watch(() => props.originalWidth, (newWidth) => {
  if (props.initialWidth && props.initialWidth !== newWidth) {
    useCustomSize.value = true
    customWidth.value = props.initialWidth
    customWidthInput.value = props.initialWidth
  } else {
    useCustomSize.value = false
    customWidth.value = newWidth
    customWidthInput.value = newWidth
  }
}, { immediate: true })

// Emit resolved state whenever it changes
watch([() => useCustomSize.value, customWidth, isWidthValid], () => {
  emit('change', {
    width: useCustomSize.value ? customWidth.value : undefined,
    valid: isWidthValid.value
  })
}, { immediate: true })

// In manual mode: skip the two-phase commit — apply valid input immediately
watch(() => props.autoApply, (val) => {
  if (!val && isWidthValid.value && isDirty.value) applySize()
})
watch(customWidthInput, () => {
  if (!props.autoApply && isWidthValid.value) applySize()
})
</script>

<template>
  <div class="flex flex-col items-start gap-1">
    <div class="flex items-center gap-1.5">
      <label
        for="img-width"
        class="text-xs text-gray-500 dark:text-gray-400"
      >W</label>
      <UInput
        id="img-width"
        v-model="customWidthInput"
        type="number"
        :min="1"
        :max="MAX_WIDTH"
        class="w-16"
        :color="useCustomSize && !isWidthValid ? 'error' : 'neutral'"
        @focus="enableCustomSize"
        @keydown.enter="applySize"
      />
      <span class="text-xs text-gray-500 dark:text-gray-400">&times;</span>
      <label
        for="img-height"
        class="text-xs text-gray-500 dark:text-gray-400"
      >H</label>
      <UInput
        id="img-height"
        :model-value="calculatedHeight"
        type="number"
        class="w-16 opacity-50"
        disabled
      />
    </div>
    <div
      v-if="autoApply !== false || (useCustomSize && !isDirty)"
      class="flex items-center gap-2"
    >
      <UButton
        v-if="autoApply !== false"
        label="Apply"
        size="xs"
        :color="isDirty && isWidthValid ? 'primary' : 'neutral'"
        :variant="isDirty && isWidthValid ? 'solid' : 'soft'"
        :disabled="!isDirty || !isWidthValid"
        @click="applySize"
      />
      <button
        v-if="useCustomSize && !isDirty"
        type="button"
        class="text-xs text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
        @click="resetToOriginalSize"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<style scoped>
:deep(input[type="number"]) {
  -moz-appearance: textfield;
}

@media (max-width: 1023px) {
  :deep(input[type="number"]) {
    font-size: 16px;
  }
}

:deep(input[type="number"])::-webkit-outer-spin-button,
:deep(input[type="number"])::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
