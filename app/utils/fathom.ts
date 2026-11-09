// Fathom is loaded from a CDN script in nuxt.config.ts; it may be missing (ad blockers, dev)
export function trackEvent(name: string) {
  (window as { fathom?: { trackEvent: (name: string) => void } }).fathom?.trackEvent(name)
}
