<template>
  <MarkdownEditorContextMenu
    :x="x"
    :y="y"
  >
    <MarkdownEditorContextMenuInlineItem
      :active="isActive.bold"
      @click="emit('toggle-bold')"
    >
      <strong>B</strong>
    </MarkdownEditorContextMenuInlineItem>

    <MarkdownEditorContextMenuInlineItem
      :active="isActive.italic"
      @click="emit('toggle-italic')"
    >
      <em>I</em>
    </MarkdownEditorContextMenuInlineItem>

    <MarkdownEditorContextMenuInlineItem
      :active="isActive.underline"
      @click="emit('toggle-underline')"
    >
      <span style="text-decoration: underline">U</span>
    </MarkdownEditorContextMenuInlineItem>
  </MarkdownEditorContextMenu>
</template>

<script setup lang="ts">
defineProps<{
  x: number;
  y: number;
  isActive: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
}>();

const emit = defineEmits<{
  "toggle-bold": [];
  "toggle-italic": [];
  "toggle-underline": [];
}>();
</script>
