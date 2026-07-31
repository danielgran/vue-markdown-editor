<template>
  <MarkdownEditorContextMenu
    :x="x"
    ref="contextMenuRef"
    :y="y"
    @mousedown.stop
    @click="$emit('click')"
  >
    <div class="markdown-editor-file-context-menu-content">
      <MarkdownEditorContextMenuBlockItem @click="emit('editAttributes')">
        Edit Attributes
      </MarkdownEditorContextMenuBlockItem>
      <MarkdownEditorContextMenuBlockItem @click="emit('download')">
        Download
      </MarkdownEditorContextMenuBlockItem>
      <MarkdownEditorContextMenuBlockItem @click="emit('retry')">
        Retry Upload
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
  download: [];
  retry: [];
  close: [];
  click: [];
}>();

onClickOutside(
  () => contextMenuRef.value?.rootEl ?? null,
  () => {
    emit('close');
  }
);
</script>

<style lang="scss" scoped>
.markdown-editor-file-context-menu-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 10rem;
}
</style>
