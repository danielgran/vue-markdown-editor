import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
        formats: ['es'],
        entry: resolve(import.meta.dirname, 'src', 'index.ts'),
        fileName: 'vue-markdown-editor',
    },
    rollupOptions: {
        external: ['vue', 'date-fns', '@date-fns/tz', '@floating-ui/vue', '@vueuse/core'],
    },
},
});