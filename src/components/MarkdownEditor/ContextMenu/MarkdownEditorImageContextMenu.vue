<template>
  <MarkdownEditorContextMenu
    :x="x"
    ref="contextMenuRef"
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
import { ref } from "vue";
import MarkdownEditorContextMenu from "./MarkdownEditorContextMenu.vue";
import MarkdownEditorContextMenuBlockItem from "./MarkdownEditorContextMenuBlockItem.vue";
import { onClickOutside } from "@vueuse/core";

const contextMenuRef = ref<InstanceType<typeof MarkdownEditorContextMenu> | null>(null);

defineProps<{
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  editAttributes: [];
  close: [];
}>();

onClickOutside(contextMenuRef, () => {
  emit('close');
});
</script>

<style lang="scss" scoped>
.markdown-editor-image-context-menu-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 10rem;
}
</style>
