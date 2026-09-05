import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://tsuji-tomonori.github.io',
  base: '/biribiri-racers',
  output: 'static',
  trailingSlash: 'always',
  vite: {
    define: {
      __BUILD_SHA__: JSON.stringify(process.env.GITHUB_SHA ?? 'local'),
    },
  },
});
