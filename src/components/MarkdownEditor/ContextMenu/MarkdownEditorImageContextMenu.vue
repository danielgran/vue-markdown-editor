<template>
  <MarkdownEditorContextMenu
    :x="x"
    :y="y"
  >
    <div class="markdown-editor-image-context-menu-content">
      <MarkdownEditorContextMenuBlockItem @click="emit('edit-attributes')">
        Edit Attributes
      </MarkdownEditorContextMenuBlockItem>
      <MarkdownEditorContextMenuBlockItem @click="emit('edit-attributes')">
        Edit Attributes
      </MarkdownEditorContextMenuBlockItem>
    </div>
  </MarkdownEditorContextMenu>
</template>

<script setup lang="ts">
defineProps<{
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  "edit-attributes": [];
}>();
</script>

<style lang="scss" scoped>
.markdown-editor-image-context-menu-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 10rem;
}
</style>
