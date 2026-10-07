<script setup>
const siteUrl = 'https://ditherit.com'
const route = useRoute()

// Netlify serves prerendered pages at their trailing-slash URL (/about → 301 → /about/)
const canonicalUrl = computed(() => {
  const path = route.path === '/' || route.path.endsWith('/') ? route.path : `${route.path}/`
  return `${siteUrl}${path}`
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    { rel: 'canonical', href: canonicalUrl }
  ]
})

const title = 'Dither it!'
const description = 'Free online image dithering tool. Floyd-Steinberg, Atkinson, Bayer ordered dithering, animated GIFs, and multi-image upload — processed locally in your browser.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogSiteName: title,
  ogUrl: canonicalUrl,
  ogImage: `${siteUrl}/og-image.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterImage: `${siteUrl}/og-image.png`
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ContactModal />
  </UApp>
</template>
