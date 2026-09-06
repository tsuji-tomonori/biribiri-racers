import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://tsuji-tomonori.github.io',
  base: process.env.PUBLIC_SITE_BASE ?? '/biribiri-racers',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    define: {
      __BUILD_SHA__: JSON.stringify(process.env.GITHUB_SHA ?? 'local'),
    },
  },
});
