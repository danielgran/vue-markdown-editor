<template>
  <div class="markdown-editor-focus-controls">
    <span class="drag-handle" title="Drag to reorder"> ⠿ </span>
    <button
      class="focus-control-btn"
      type="button"
      tabindex="-1"
      title="Delete block"
      @click="emit('delete')"
    >
      🗑️
    </button>
    <button
      class="focus-control-btn"
      type="button"
      tabindex="-1"
      title="Add block below"
      @click="emit('add')"
    >
      +
    </button>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: "delete"): void;
  (e: "add"): void;
}>();
</script>

<style lang="scss" scoped>
.markdown-editor-focus-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  
  .drag-handle {
    cursor: grab;
    padding: 0 0.2rem;
    user-select: none;
    font-size: 1rem;
    opacity: 0.4;
    line-height: 1;

    &:active {
      cursor: grabbing;
    }
  }

  .focus-control-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: transparent;
    cursor: pointer;
    font-size: 0.75rem;
    line-height: 1;
    opacity: 0.6;
    transition:
      opacity 0.1s,
      background 0.1s;

    &:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.07);
    }
  }
}
</style>
