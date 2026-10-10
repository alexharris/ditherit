<script setup lang="ts">
const isOpen = ref(false)

// Bound rather than a static src: Nuxt's dev-server rewrite of static public paths breaks after HMR (`/&/quant-frog.png`)
const frogSrc = '/quant-frog.png'

// Fathom is loaded from a CDN script in nuxt.config.ts; it may be missing (ad blockers, dev)
function trackEvent(name: string) {
  (window as { fathom?: { trackEvent: (name: string) => void } }).fathom?.trackEvent(name)
}

type Answer = 'say hello' | 'dont'

const RESPONSES: Record<Answer, string> = {
  'say hello': 'Quant Frog smiles in your general direction.',
  'dont': 'Quant Frog stares into the distance.'
}

const answer = ref<Answer | null>(null)

function respond(choice: Answer) {
  trackEvent(`quant frog ${choice}`)
  answer.value = choice
}

// Ask again each time the modal is opened
watch(isOpen, (open) => {
  if (open) answer.value = null
})
</script>

<template>
  <div>
    <UModal
      v-model:open="isOpen"
      title="Meet Quant Frog"
      :ui="{ content: 'divide-y-0', header: 'p-0 min-h-0', title: 'sr-only' }"
    >
      <UButton
        color="neutral"
        variant="link"
        aria-label="Meet Quant Frog"
        class="quant-frog p-0"
        @click="trackEvent('quant frog click')"
      >
        <img
          :src="frogSrc"
          alt=""
          draggable="false"
          class="w-29 select-none"
        >
      </UButton>

      <template #body>
        <div class="flex flex-col items-center gap-4 text-center">
          <img
            :src="frogSrc"
            alt=""
            class="w-40"
          >
          <p
            v-if="answer"
            class="text-sm text-gray-800 dark:text-gray-100"
          >
            <em>{{ RESPONSES[answer] }}</em>
          </p>
          <template v-else>
            <p class="text-sm text-gray-800 dark:text-gray-100">
              Say hello to <strong>Quant Frog</strong>, the new mascot of Dither it!
            </p>
            <div class="flex gap-2">
              <UButton
                label="👋 Say hello"
                color="primary"
                @click="respond('say hello')"
              />
              <UButton
                label="🚫 Don't!"
                color="neutral"
                variant="soft"
                @click="respond('dont')"
              />
            </div>
          </template>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.quant-frog img {
  transform-origin: 50% 90%;
}

.quant-frog:hover img {
  animation: frog-wiggle 0.35s ease-in-out;
}

@keyframes frog-wiggle {
  0%, 100% { transform: rotate(0deg); }
  35%      { transform: rotate(10deg); }
  70%      { transform: rotate(-3deg); }
}

@media (prefers-reduced-motion: reduce) {
  .quant-frog:hover img { animation: none; }
}
</style>
