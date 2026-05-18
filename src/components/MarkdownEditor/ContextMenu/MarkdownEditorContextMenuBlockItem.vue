<template>
  <button
    type="button"
    class="markdown-editor-context-menu-block-item"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.markdown-editor-context-menu-block-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  width: 100%;
  text-align: left;
  white-space: nowrap;

  &:hover {
    background: #f3f4f6;
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
