<script setup lang="ts">
const toast = useToast()
const isModalOpen = ref(false)
const isSubmitting = ref(false)

async function handleSubmit(event: Event) {
  const form = event.target as HTMLFormElement
  isSubmitting.value = true
  try {
    const formData = new FormData(form)
    const response = await fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData as any).toString()
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    toast.add({
      title: 'Message sent!',
      description: 'Thanks for your feedback.',
      color: 'success'
    })
    form.reset()
    isModalOpen.value = false
  } catch {
    toast.add({
      title: 'Failed to send',
      description: 'Please try again later.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- Hidden form for Netlify detection at build time -->
  <form name="contact" netlify netlify-honeypot="bot-field" hidden>
    <input type="text" name="name" />
    <input type="email" name="email" />
    <textarea name="message"></textarea>
  </form>

  <UModal v-model:open="isModalOpen">
    <UCard variant="soft" :ui="{ root: 'bg-ditherit-tint shadow-sm', body: 'p-4 sm:p-4' }">
      <h2 class="pb-2 text-sm font-medium text-highlighted">📋 Improve Dither it!</h2>
      <p class="pb-2 text-sm text-gray-800 dark:text-gray-100">Found a bug? Have an idea for a feature? Let me know!</p>
      <span class="text-sm font-medium text-blue-600 underline text-highlighted cursor-pointer transition-colors">
        Submit Feedback
      </span>
    </UCard>

    <template #content>
      <div class="px-4 py-4">
        <h2 class="text-lg font-semibold text-highlighted mb-4">Submit Feedback</h2>

        <form
          name="contact"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <input type="hidden" name="form-name" value="contact" />
          <p class="hidden">
            <label>Don't fill this out if you're human: <input name="bot-field" /></label>
          </p>

          <div class="space-y-2">
            <label for="feedback-name" class="block text-sm font-medium text-highlighted">Name</label>
            <input
              type="text"
              id="feedback-name"
              name="name"
              required
              class="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ditherit dark:focus:ring-ditherit transition-colors"
            />
          </div>

          <div class="space-y-2">
            <label for="feedback-email" class="block text-sm font-medium text-highlighted">Email</label>
            <input
              type="email"
              id="feedback-email"
              name="email"
              required
              class="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ditherit dark:focus:ring-ditherit transition-colors"
            />
          </div>

          <div class="space-y-2">
            <label for="feedback-message" class="block text-sm font-medium text-highlighted">Message</label>
            <textarea
              id="feedback-message"
              name="message"
              rows="5"
              required
              class="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ditherit dark:focus:ring-ditherit transition-colors resize-none"
            ></textarea>
          </div>

          <UButton
            type="submit"
            label="Send Message"
            color="primary"
            :loading="isSubmitting"
            :disabled="isSubmitting"
          />
        </form>
      </div>
    </template>
  </UModal>
</template>
