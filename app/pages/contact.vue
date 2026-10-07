<script setup lang="ts">
// The contact form is now a modal; keep /contact working for old links and bookmarks
const { open } = useContactModal()

onMounted(() => {
  open()
  navigateTo('/', { replace: true })
})
</script>

<template>
  <div />
</template>
