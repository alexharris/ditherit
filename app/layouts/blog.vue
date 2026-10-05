<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'About', to: '/about' },
  { label: 'Resources', to: '/resources' },
  { label: 'Support', to: '/support' },
  { label: 'Contact', to: '/contact' },
  { label: 'Design System', to: '/design-system' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader show-back />
    <main class="flex-1 overflow-y-auto pt-12 lg:pt-0">
      <div class="mx-auto max-w-5xl px-6 py-10">
        <div class="mb-8">
          <NuxtLink
            to="/"
            class="hidden items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 lg:inline-flex"
          >
            <UIcon name="i-lucide-arrow-left" class="size-4" />
            Back to app
          </NuxtLink>
          <h1 class="mt-4 text-3xl font-bold text-gray-800 dark:text-gray-100">
            Blog
          </h1>
        </div>
        <div class="flex flex-col gap-10 lg:flex-row">
          <div class="min-w-0 flex-1">
            <slot />
          </div>
          <aside class="w-full shrink-0 space-y-6 lg:w-64">
            <NewsletterSignup />
            <div>
              <a
                href="/rss.xml"
                class="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <UIcon name="i-lucide-rss" class="size-4" />
                RSS Feed
              </a>
            </div>
            <SidebarFeedback />
            <a href="https://v2.ditherit.com" target="_blank" rel="noopener" class="block">
              <UCard
                variant="soft"
                :ui="{ root: 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer shadow-sm', body: 'p-3 sm:p-3' }"
              >
                <p class="mb-1 text-sm font-medium text-highlighted">
                  🏁 Looking for the old version?
                </p>
                <p class="text-sm text-gray-800 dark:text-gray-100">
                  Version 2 is still available at v2.ditherit.com.
                </p>
              </UCard>
            </a>
          </aside>
        </div>
      </div>
    </main>
    <footer class="border-t border-gray-100 dark:border-gray-800">
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-4">
        <nav class="flex flex-wrap items-center justify-center gap-0.5">
          <UButton
            v-for="item in navItems"
            :key="item.to"
            :label="item.label"
            :to="item.to"
            :variant="route.path === item.to ? 'soft' : 'ghost'"
            color="neutral"
            size="sm"
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
