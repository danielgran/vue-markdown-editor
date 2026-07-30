<template>
  <MarkdownEditorContextMenu
    :x="x"
    :y="y"
  >
    <div class="markdown-editor-image-context-menu-content">
      <MarkdownEditorContextMenuBlockItem @click="emit('editAttributes')">
        Edit Attributes
      </MarkdownEditorContextMenuBlockItem>
    </div>
  </MarkdownEditorContextMenu>
</template>

<script setup lang="ts">
import MarkdownEditorContextMenu from "./MarkdownEditorContextMenu.vue";
import MarkdownEditorContextMenuBlockItem from "./MarkdownEditorContextMenuBlockItem.vue";

defineProps<{
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  editAttributes: [];
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
