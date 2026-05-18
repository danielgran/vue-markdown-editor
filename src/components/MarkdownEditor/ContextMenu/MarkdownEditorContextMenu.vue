<template>
  <div
    class="markdown-editor-context-menu"
    :style="positionStyle"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  x: number;
  y: number;
}>();

const positionStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
}));
</script>

<style lang="scss" scoped>
.markdown-editor-context-menu {
  position: fixed;
  z-index: 1000;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 0.25rem;
  display: flex;
  gap: 0.25rem;
}
</style>
