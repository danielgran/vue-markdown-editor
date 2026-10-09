<template>
  <MarkdownEditorContextMenu
    ref="contextMenuRef"
    :x="x"
    :y="y"
    :anchor="anchor"
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

<script lang="ts" setup>
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import MarkdownEditorContextMenu from "@/components/MarkdownEditor/ContextMenu/MarkdownEditorContextMenu.vue";
import MarkdownEditorContextMenuBlockItem from "@/components/MarkdownEditor/ContextMenu/MarkdownEditorContextMenuBlockItem.vue";

const contextMenuRef = ref<InstanceType<typeof MarkdownEditorContextMenu> | null>(null);

defineProps<{
  x: number;
  y: number;
  anchor?: HTMLElement | null;
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
    emit("close");
  },
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
