<script setup lang="ts">
const { isOpen } = useContactModal()
const { buildDebugInfo } = useShareSettings()
const toast = useToast()

const name = ref('')
const email = ref('')
const message = ref('')
const botField = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)

const hasDebugInfo = computed(() => message.value.includes('Dither it! debug info'))

function addDebugInfo() {
  const info = buildDebugInfo()
  message.value = message.value.trim() ? `${message.value.trimEnd()}\n\n${info}` : `\n\n${info}`
}

function reset() {
  name.value = ''
  email.value = ''
  message.value = ''
  botField.value = ''
  submitted.value = false
}

// Start fresh each time the modal opens after a successful send
watch(isOpen, (open) => {
  if (open && submitted.value) reset()
})

async function handleSubmit() {
  isSubmitting.value = true
  try {
    const response = await fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        'form-name': 'contact',
        'bot-field': botField.value,
        'name': name.value,
        'email': email.value,
        'message': message.value
      }).toString()
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    submitted.value = true
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
  <UModal v-model:open="isOpen" title="Contact" :description="submitted ? undefined : 'Have a feature request, found a bug, or just want to say hi?'">
    <template #body>
      <div
        v-if="submitted"
        class="flex flex-col items-center gap-3 py-6 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
          <UIcon name="i-lucide-check" class="size-6 text-green-500" />
        </div>
        <div>
          <p class="text-base font-medium text-gray-800 dark:text-gray-100">
            Message sent!
          </p>
          <p class="mt-1 text-sm text-gray-500">
            Thanks for your feedback. I'll get back to you within a few days.
          </p>
        </div>
        <UButton
          label="Send another"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="reset"
        />
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <p class="hidden">
          <label>Don't fill this out if you're human: <input v-model="botField" name="bot-field" /></label>
        </p>

        <UFormField label="Name" required>
          <UInput v-model="name" name="name" required class="w-full" />
        </UFormField>

        <UFormField label="Email" required>
          <UInput v-model="email" name="email" type="email" required class="w-full" />
        </UFormField>

        <UFormField label="Message" required>
          <UTextarea
            v-model="message"
            name="message"
            :rows="6"
            required
            class="w-full"
          />
          <template #description>
            <span v-if="hasDebugInfo" class="inline-flex items-center gap-1">
              <UIcon name="i-lucide-check" class="size-3.5" />
              Debug info added
            </span>
            <span v-else>
              Reporting a bug?
              <UButton
                label="Add debug info"
                color="neutral"
                variant="link"
                size="xs"
                class="p-0 align-baseline underline"
                @click="addDebugInfo"
              />
            </span>
          </template>
        </UFormField>

        <UButton
          type="submit"
          label="Send message"
          icon="i-lucide-send"
          color="primary"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        />
      </form>
    </template>
  </UModal>
</template>
