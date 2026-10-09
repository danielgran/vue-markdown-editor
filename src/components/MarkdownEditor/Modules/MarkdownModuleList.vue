<template>
  <EditorContent
    :editor="editor"
    @keydown.enter.stop
  />
</template>

<script lang="ts" setup>
import { EditorContent } from "@tiptap/vue-3";
import { useListModule } from "@/components/MarkdownEditor/Composable/useListModule";
import type MarkdownModuleListState from "@/components/MarkdownEditor/Modules/MarkdownModuleListState";

const modelValue = defineModel<MarkdownModuleListState>({ required: true });

const { editor, focus } = useListModule({ modelValue, tag: "ul" });

defineExpose({ focus, editor });
</script>

<style lang="scss" scoped>
:deep(.tiptap) {
  ul {
    padding-left: 1.5rem;
    margin: 0;
  }
}
</style>
