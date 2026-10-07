// The contact form is a single modal mounted in app.vue; anything can open it
const isOpen = ref(false)

export function useContactModal() {
  return {
    isOpen,
    open: () => { isOpen.value = true },
    close: () => { isOpen.value = false }
  }
}
