import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 4010,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Force the pure (Node-safe) decode build so the bundle has no top-level
      // `document` access and can be imported during Nuxt SSR. The `browser`
      // condition of this package selects index.dom.js, which calls
      // document.createElement('i') at module top level and crashes SSR.
      'decode-named-character-reference': resolve(
        import.meta.dirname,
        'node_modules',
        'decode-named-character-reference',
        'index.js',
      ),
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
      external: ['vue'],
    },
  },
});