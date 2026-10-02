<script setup lang="ts">
definePageMeta({ layout: 'blog' })
useSeoMeta({ title: 'Blog — Dither it!' })

const { data: posts } = await useAsyncData('blog', () =>
  queryCollection('blog').where('draft', '<>', 'true').order('date', 'DESC').all()
)
</script>

<template>
  <div class="space-y-10">
    <article
      v-for="(post, i) in posts"
      :key="post.path"
      class="space-y-3"
    >
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {{ post.title }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) }}
        </p>
      </div>
      <div class="prose prose-gray dark:prose-invert max-w-none">
        <ContentRenderer :value="post" />
      </div>
      <USeparator v-if="i < (posts?.length ?? 0) - 1" class="pt-4" />
    </article>
  </div>
</template>
