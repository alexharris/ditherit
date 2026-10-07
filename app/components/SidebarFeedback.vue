<script setup lang="ts">
const { open } = useContactModal()
</script>

<template>
  <UCard
    variant="soft"
    :ui="{ root: 'bg-ditherit-tint shadow-sm cursor-pointer', body: 'p-4 sm:p-4' }"
    @click="open"
  >
    <h2 class="pb-2 text-sm font-medium text-highlighted">
      📋 Improve Dither it!
    </h2>
    <p class="pb-2 text-sm text-gray-800 dark:text-gray-100">
      Found a bug? Have an idea for a feature? Let me know!
    </p>
    <span class="text-sm font-medium text-blue-600 underline text-highlighted cursor-pointer transition-colors">
      Submit Feedback
    </span>
  </UCard>
</template>
