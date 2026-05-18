<template>
  <button
    type="button"
    class="markdown-editor-context-menu-inline-item"
    :class="{ 'is-active': active }"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.markdown-editor-context-menu-inline-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  min-width: 2rem;
  min-height: 2rem;

  &:hover {
    background: #f3f4f6;
  }

  &.is-active {
    background: #dbeafe;
    color: #1e40af;
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
