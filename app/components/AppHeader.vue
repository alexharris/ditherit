<script setup lang="ts">
const colorMode = useColorMode()
const router = useRouter()
const route = useRoute()
const { open: openContact } = useContactModal()

defineProps<{ showBack?: boolean }>()

// Mobile drawer
const isMenuOpen = ref(false)

const navItems = [
  { id: 'about', label: 'About', icon: '💡', to: '/about' },
  { id: 'resources', label: 'Resources', icon: '📚', to: '/resources' },
  { id: 'blog', label: 'Blog', icon: '📣', to: '/blog' },
  { id: 'contact', label: 'Contact', icon: '✉️', to: '/contact', contact: true },
]

function mobileNavigate(item: typeof navItems[number]) {
  isMenuOpen.value = false
  if ('contact' in item) openContact()
  else router.push(item.to)
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 flex h-12 shrink-0 items-center border-b border-gray-100 bg-white px-4 dark:border-gray-800 dark:bg-gray-800 lg:relative lg:inset-x-auto lg:top-auto lg:z-auto">
    <!-- Mobile back button -->
    <UButton
      v-if="showBack"
      color="neutral"
      variant="ghost"
      size="sm"
      class="lg:hidden"
      aria-label="Back"
      to="/"
    >
      <UIcon name="i-lucide-arrow-left" class="size-6" />
    </UButton>

    <!-- Logo -->
    <span class="absolute left-1/2 -translate-x-1/2">
      <NuxtLink to="/">
        <svg viewBox="0 0 379 65" fill="none" xmlns="http://www.w3.org/2000/svg" class="inline-block h-6">
          <path d="M48.248 33.76C48.248 18.688 39.512 7.936 27.032 7.936H26.552C23.192 7.936 22.328 9.568 22.328 13.312L22.424 48.448C22.424 52.192 23.288 55.168 28.472 55.168H28.952C42.392 55.168 48.248 44.992 48.248 33.76ZM13.688 0.0639992H27.416C52.376 0.0639992 66.68 15.04 66.68 33.856C66.68 49.6 53.24 64 31.64 64H13.784C6.104 64 0.632 62.656 0.632 59.104C0.632 56.032 5.144 53.152 5.144 49.696L4.952 14.368C4.952 10.912 0.44 8.032 0.44 4.96C0.44 1.408 5.912 0.0639992 13.688 0.0639992ZM90.2698 5.152C91.2298 8.32 89.0218 11.872 82.8778 13.504C81.1498 13.984 79.5178 14.176 77.9818 14.176C74.0458 14.176 70.9738 12.736 70.3018 10.432C69.4378 7.264 71.7418 3.712 77.6938 2.08C79.4218 1.6 81.1498 1.408 82.6858 1.408C86.7178 1.408 89.6938 2.848 90.2698 5.152ZM89.9818 49.792C89.9818 53.152 94.0138 56.032 94.0138 59.104C94.0138 62.656 88.5418 64 81.8218 64C75.1018 64 69.7258 62.656 69.7258 59.104C69.7258 56.032 73.6618 53.152 73.6618 49.792V32.608C73.6618 29.248 70.3018 29.152 69.6298 26.08C68.8618 22.816 73.2778 19.84 79.3258 18.4C81.6298 17.92 83.4538 17.536 84.9898 17.536C88.4458 17.536 89.9818 19.168 89.9818 23.584V49.792ZM98.789 30.592C98.789 28.768 98.405 28.096 96.869 28.096C94.757 28.096 93.605 27.136 93.605 25.216V23.104C93.605 21.088 94.853 20.224 97.157 20.224H97.541C102.341 20.224 103.013 18.592 104.645 15.136L105.413 13.504C106.853 10.432 107.813 9.856 110.789 9.856H111.941C113.957 9.856 115.109 10.528 115.109 13.408V16.48C115.109 18.976 115.589 20.224 118.949 20.224H122.693C124.997 20.224 126.245 21.088 126.245 23.104V25.216C126.245 27.136 124.997 28.096 122.693 28.096H118.949C115.589 28.096 115.109 29.248 115.109 31.744V42.784C115.109 47.968 115.397 51.232 119.045 51.232C121.541 51.232 123.557 49.984 124.805 48.736C125.669 47.776 126.533 47.104 127.877 47.488C129.125 47.872 129.605 49.696 128.837 51.904C126.533 58.432 122.117 64 113.093 64C104.741 64 98.789 58.912 98.789 48.736V30.592ZM150.457 49.792C150.457 53.152 154.681 56.032 154.681 59.104C154.681 62.656 149.017 64 142.297 64C135.577 64 129.817 62.656 129.817 59.104C129.817 56.032 134.137 53.152 134.137 49.792V17.44C134.137 14.08 130.489 13.984 129.817 11.008C128.953 7.552 134.425 4.288 140.761 2.272C143.257 1.504 145.369 1.024 147.001 1.024C149.593 1.024 151.129 1.984 151.609 4.096C152.281 7.168 150.457 11.872 150.457 17.44V22.72C150.649 23.488 150.937 23.872 151.225 23.872C151.609 23.872 152.089 23.392 152.761 22.528C154.585 20.32 157.945 17.536 162.937 17.536C170.329 17.536 171.961 22.72 174.265 32.512L178.585 49.504C180.025 55.264 183.865 55.264 183.865 59.104C183.865 62.656 178.489 64 171.769 64C165.049 64 159.673 62.656 159.673 59.104C159.673 56.032 162.169 56.032 161.209 50.56L158.521 35.872C157.849 32.608 156.793 30.112 154.201 30.112C151.417 30.112 150.457 32.128 150.457 36.832V49.792ZM204.183 38.848C208.215 38.848 210.807 34.912 210.807 31.264C210.807 26.848 209.079 24.448 206.295 24.448C203.799 24.448 200.439 28.576 200.439 33.952C200.439 36.544 201.879 38.848 204.183 38.848ZM223.383 48.928C225.783 48.064 227.895 50.464 227.127 53.728C225.879 58.912 218.103 64 207.351 64C194.775 64 183.159 56.32 183.159 41.056C183.159 25.312 195.543 17.536 207.063 17.536C219.831 17.536 226.839 22.72 226.839 30.496C226.839 38.368 218.775 41.44 207.351 43.84C204.375 44.512 204.759 47.008 206.007 48.064C208.407 50.176 211.383 51.232 214.359 51.232C218.583 51.232 221.463 49.6 223.383 48.928ZM250.482 49.792C250.482 53.152 254.418 56.032 254.418 59.104C254.418 62.656 249.042 64 242.322 64C235.602 64 230.13 62.656 230.13 59.104C230.13 56.032 234.066 53.152 234.066 49.792V32.8C234.066 29.344 230.802 29.248 230.13 26.272C229.362 22.912 233.682 19.936 239.826 18.496C242.418 17.92 244.338 17.536 245.778 17.536C247.986 17.536 249.138 18.4 249.81 20.224C250.098 20.8 250.29 21.472 250.386 22.336C250.77 23.776 251.25 24.448 251.922 24.448C252.306 24.448 252.786 24.16 253.266 23.488C256.146 20.032 258.738 17.536 264.114 17.536C272.178 17.536 275.634 25.984 272.37 33.28C270.546 37.312 267.666 39.136 264.882 39.136C262.386 39.136 259.986 37.6 258.642 34.912C257.106 31.936 255.666 30.112 253.362 30.112C251.058 30.112 250.482 32.128 250.482 36.832V49.792ZM313.489 5.152C314.449 8.32 312.241 11.872 306.097 13.504C304.369 13.984 302.737 14.176 301.201 14.176C297.265 14.176 294.193 12.736 293.521 10.432C292.657 7.264 294.961 3.712 300.913 2.08C302.641 1.6 304.369 1.408 305.905 1.408C309.937 1.408 312.913 2.848 313.489 5.152ZM313.201 49.792C313.201 53.152 317.233 56.032 317.233 59.104C317.233 62.656 311.761 64 305.041 64C298.321 64 292.945 62.656 292.945 59.104C292.945 56.032 296.881 53.152 296.881 49.792V32.608C296.881 29.248 293.521 29.152 292.849 26.08C292.081 22.816 296.497 19.84 302.545 18.4C304.849 17.92 306.673 17.536 308.209 17.536C311.665 17.536 313.201 19.168 313.201 23.584V49.792ZM322.008 30.592C322.008 28.768 321.624 28.096 320.088 28.096C317.976 28.096 316.824 27.136 316.824 25.216V23.104C316.824 21.088 318.072 20.224 320.376 20.224H320.76C325.56 20.224 326.232 18.592 327.864 15.136L328.632 13.504C330.072 10.432 331.032 9.856 334.008 9.856H335.16C337.176 9.856 338.328 10.528 338.328 13.408V16.48C338.328 18.976 338.808 20.224 342.168 20.224H345.912C348.216 20.224 349.464 21.088 349.464 23.104V25.216C349.464 27.136 348.216 28.096 345.912 28.096H342.168C338.808 28.096 338.328 29.248 338.328 31.744V42.784C338.328 47.968 338.616 51.232 342.264 51.232C344.76 51.232 346.776 49.984 348.024 48.736C348.888 47.776 349.752 47.104 351.096 47.488C352.344 47.872 352.824 49.696 352.056 51.904C349.752 58.432 345.336 64 336.312 64C327.96 64 322.008 58.912 322.008 48.736V30.592ZM371.35 37.888C370.198 41.44 368.758 42.592 366.742 42.592C364.726 42.592 363.382 41.44 362.134 37.888C361.558 35.968 354.838 16.48 354.838 9.472C354.838 3.616 360.118 0.0639992 366.646 0.0639992C373.078 0.0639992 378.358 3.616 378.358 9.472C378.358 16.48 372.022 35.968 371.35 37.888ZM376.822 54.208C377.302 58.72 373.942 63.232 368.086 64.096C361.942 64.96 357.046 61.792 356.566 57.184C356.086 52.672 359.446 48.16 365.302 47.296C371.446 46.432 376.246 49.6 376.822 54.208Z" class="fill-ditherit" />
        </svg>
      </NuxtLink>
    </span>

    <!-- Desktop nav (hidden on mobile) -->
    <nav class="mr-2 hidden items-center gap-0.5 lg:ml-auto lg:flex">
      <UButton
        v-for="item in navItems"
        :key="item.id"
        :label="item.label"
        color="neutral"
        :variant="route.path === item.to ? 'soft' : 'ghost'"
        :aria-current="route.path === item.to ? 'page' : undefined"
        size="sm"
        :to="'contact' in item ? undefined : item.to"
        @click="'contact' in item && openContact()"
      />
    </nav>

    <!-- Desktop support button -->
    <UButton
      to="/support"
      label="❤️ Support"
      color="primary"
      variant="outline"
      size="sm"
      class="hidden lg:flex bg-white dark:bg-gray-800"
    />

    <!-- Desktop dark mode toggle -->
    <UButton
      :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
      :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      color="neutral"
      variant="ghost"
      size="sm"
      class="hidden lg:flex"
      @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
    />

    <!-- Mobile dark mode toggle + menu button -->
    <div class="ml-auto flex items-center gap-0.5 lg:hidden">
      <UButton
        :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
        :aria-label="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
      />
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Menu"
        @click="isMenuOpen = true"
      />
    </div>
  </header>

  <!-- Mobile app menu slideover -->
  <USlideover
    v-model:open="isMenuOpen"
    side="right"
    :ui="{ header: 'flex items-center min-h-12 justify-end shrink-0 p-0 border-b border-gray-100 dark:border-gray-800 sm:px-4', title: 'text-highlighted flex-1', close: 'relative top-auto end-auto ml-4' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <!-- Nav section links -->
        <div class="space-y-0.5">
          <button
            v-for="item in navItems"
            :key="item.id"
            class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
            :class="route.path === item.to
              ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
              : 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800'"
            :aria-current="route.path === item.to ? 'page' : undefined"
            @click="mobileNavigate(item)"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-base leading-none">{{ item.icon }}</span>
              {{ item.label }}
            </div>
            <UIcon
              name="i-lucide-arrow-up-right"
              class="size-4 text-gray-500"
            />
          </button>
        </div>

        <USeparator />

        <!-- Support CTA -->
        <UButton
          to="/support"
          label="❤️ Support Dither it!"
          color="primary"
          variant="outline"
          block
          class="bg-white dark:bg-gray-800"
          @click="isMenuOpen = false"
        />

        <SidebarFeedback />

        <SidebarLatestPost />

        <NewsletterSignup />
      </div>
    </template>
  </USlideover>
</template>
