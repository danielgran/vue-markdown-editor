<template>
  <MarkdownEditorContextMenu
    ref="contextMenuRef"
    :x="x"
    :y="y"
    :anchor="anchor"
    @mousedown.stop
    @click="$emit('click')"
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
import { onClickOutside } from "@vueuse/core";
import MarkdownEditorContextMenu from "./MarkdownEditorContextMenu.vue";
import MarkdownEditorContextMenuBlockItem from "./MarkdownEditorContextMenuBlockItem.vue";

const contextMenuRef = ref<InstanceType<typeof MarkdownEditorContextMenu> | null>(null);

defineProps<{
  x: number;
  y: number;
  anchor?: HTMLElement | null;
}>();

const emit = defineEmits<{
  editAttributes: [];
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
.markdown-editor-image-context-menu-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 10rem;
}
</style>
