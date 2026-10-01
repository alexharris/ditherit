<script setup lang="ts">
definePageMeta({ layout: 'content' })
useSeoMeta({ title: 'Resources — Dither it!' })

const resourceSections = [
  {
    title: 'Articles & Tutorials',
    links: [
      {
        title: 'Dithering: a visual dithering tutorial',
        description: 'Amazing visual tutorial of how dithering works.',
        url: 'https://visualrambling.space/dithering-part-1/',
      },
      {
        title: 'Ditherpunk — The article I wish I had about monochrome image dithering',
        description: 'A great, comprehensive and technical run-down of many different dithering methods.',
        url: 'https://surma.dev/things/ditherpunk/index.html',
      },
      {
        title: 'Image Dithering: Eleven Algorithms and Source Code',
        description: 'A helpful article with great examples and in-depth info.',
        url: 'https://tannerhelland.com/2012/12/28/dithering-eleven-algorithms-source-code.html',
      },
      {
        title: 'Dithering.',
        description: 'A nice little rundown of some error diffusion algorithms, including one developed by the author.',
        url: 'https://hbfs.wordpress.com/2013/12/31/dithering/',
      },
      {
        title: 'Low-tech Magazine Solar Website',
        description: 'The inspiration for Dither it! — discusses Low-tech Magazine\'s decision to use dithered images on the solar powered version of their site.',
        url: 'https://solar.lowtechmagazine.com/about.html',
      },
    ],
  },
  {
    title: 'Tools',
    links: [
      {
        title: 'Dithering Studio',
        description: 'A cool dithering tool with a nice video mode.',
        url: 'https://ditheringstudio.com/en/',
      },
      {
        title: 'Dither me this',
        description: 'A site very similar to Dither it!',
        url: 'https://doodad.dev/dither-me-this/',
      },
      {
        title: 'Didder',
        description: 'A beefy command line interface for dithering images.',
        url: 'https://github.com/makeworld-the-better-one/didder',
      },
      {
        title: 'Image dithering with ImageMagick',
        description: 'ImageMagick has some robust quantization and dithering functionality.',
        url: 'https://legacy.imagemagick.org/Usage/quantize/',
      },
      {
        title: 'PHP imagetruecolortopalette',
        description: 'A PHP function for very simple image dithering.',
        url: 'https://www.php.net/manual/en/function.imagetruecolortopalette.php',
      },
    ],
  },
  {
    title: 'Libraries',
    links: [
      {
        title: 'RgbQuant.js',
        description: 'The quantization library that powered the original Dither it!',
        url: 'http://leeoniya.github.io/RgbQuant.js/demo/',
      },
      {
        title: 'Image-q',
        description: 'A fork of RgbQuant.js with some additional features.',
        url: 'https://github.com/ibezkrovnyi/image-quantization',
      },
    ],
  },
]
</script>

<template>
  <div class="space-y-5">
    <p class="text-base text-gray-500 dark:text-gray-400">
      A list of dithering resources from around the internet.
    </p>
    <div
      v-for="section in resourceSections"
      :key="section.title"
      class="space-y-1.5"
    >
      <p class="text-sm font-semibold uppercase tracking-wider text-gray-500">
        {{ section.title }}
      </p>
      <ul class="space-y-1">
        <li
          v-for="link in section.links"
          :key="link.url"
        >
          <a
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[--ui-primary] underline underline-offset-2 hover:opacity-75"
          >{{ link.title }}</a>
          <div class="text-sm text-gray-500">{{ link.description }}</div>
        </li>
      </ul>
    </div>
  </div>
</template>
