<template>
  <div @keydown.enter.stop>
    <EditorContent :editor="editor" />
  </div>
</template>

<script lang="ts" setup>
import { EditorContent } from "@tiptap/vue-3";
import { useListModule } from "../Composable/useListModule";
import type MarkdownModuleListState from "./MarkdownModuleListState";

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
