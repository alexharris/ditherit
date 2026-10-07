<script setup lang="ts">
const { open: openContact } = useContactModal()
const route = useRoute()
const title = computed(() => {
  const name = String(route.name ?? '').replace(/-/g, ' ')
  return name.charAt(0).toUpperCase() + name.slice(1)
})

const navItems = [
  { label: 'About', to: '/about' },
  { label: 'Resources', to: '/resources' },
  { label: 'Support', to: '/support' },
  { label: 'Contact', to: '/contact', contact: true },
  { label: 'Design System', to: '/design-system' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader show-back />
    <main class="flex-1 overflow-y-auto pt-12 lg:pt-0">
      <div class="mx-auto max-w-3xl px-6 py-10">
        <div class="mb-8">
          <NuxtLink
            to="/"
            class="hidden items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 lg:inline-flex"
          >
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            Back to app
          </NuxtLink>
          <h1 class="mt-4 text-3xl font-bold text-gray-800 dark:text-gray-100">
            {{ title }}
          </h1>
        </div>
        <slot />
      </div>
    </main>
    <footer class="border-t border-gray-100 dark:border-gray-800">
      <div class="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 py-4">
        <nav class="flex flex-wrap items-center justify-center gap-0.5">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :label="item.label"
            :to="'contact' in item ? undefined : item.to"
            :variant="route.path === item.to ? 'soft' : 'ghost'"
            color="neutral"
            size="sm"
            @click="'contact' in item && openContact()"
          />
        </nav>
        <UButton
          label="GitHub"
          icon="i-simple-icons-github"
          to="https://github.com/alexharris/ditherit"
          target="_blank"
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-arrow-up-right"
        />
      </div>
    </footer>
  </div>
</template>
