// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/content'],

  app: {
    head: {
      title: 'Dither it!',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'Free online image dithering tool. Floyd-Steinberg, Atkinson, Bayer ordered dithering, animated GIFs, and multi-image upload — processed locally in your browser.'
        },
        { name: 'theme-color', content: '#C53030' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'alternate', type: 'application/rss+xml', title: 'Dither it! Blog', href: '/rss.xml' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ],
      script: [
        { src: 'https://cdn.usefathom.com/script.js', 'data-site': 'OYXXIEJE', defer: true }
      ]
    }
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  vite: {
    optimizeDeps: {
      include: ['gifuct-js'],
      force: true
    },
    server: {
      allowedHosts: true
    }
  },

  vue: {
    compilerOptions: {
      // Treat img-comparison-slider as a custom element
      isCustomElement: tag => tag === 'img-comparison-slider'
    }
  },

  nitro: {
    prerender: {
      routes: ['/blog-latest.json', '/rss.xml']
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
