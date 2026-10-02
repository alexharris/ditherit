<template>
  <UCard variant="soft" :ui="{ root: 'bg-gray-100 dark:bg-gray-800 shadow-sm', body: 'p-4 sm:p-4' }">
    <div class="space-y-3">
      <div>
        <h2 class="mb-1 text-sm font-medium text-highlighted">
          📬 Stay Updated
        </h2>
        <p class="text-sm text-gray-800 dark:text-gray-100">
          Subscribe for occasional updates about new features.
        </p>
      </div>
      <form
        action="https://buttondown.com/api/emails/embed-subscribe/ditherit"
        method="post"
        class="flex flex-col gap-2"
      >
        <label :for="emailId" class="text-sm font-medium text-highlighted">Email address</label>
        <UInput type="email" name="email" :id="emailId" placeholder="you@example.com" class="w-full" />
        <UButton type="submit" label="Subscribe" color="primary" variant="solid" class="w-full justify-center" />
      </form>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const emailId = useId()
</script>
