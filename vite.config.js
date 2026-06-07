import { defineConfig } from 'vite';

export default defineConfig({
  // Project lives at https://hamuevoleg.github.io/landing_ridewolf/
  base: '/landing_ridewolf/',
  server: {
    port: 5175,
    open: true,
  },
  build: {
    target: 'es2020',
  },
});
