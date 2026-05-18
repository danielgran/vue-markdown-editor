<template>
  <EditorContent
    ref="editorRef"
    :editor="editor"
  />
</template>

<script lang="ts" setup>
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { ref } from "vue";
import useReflectiveState from "../Composable/useReflectiveState";
import { HeadingDocument, PreventNewline } from "../TipTap/SingleLineExtension";
import type { TextishEmits } from "../Types/TextishEmits";
import type MarkdownModuleTextState from "./MarkdownModuleTextState";

const modelValue = defineModel<MarkdownModuleTextState>({
  required: true,
});

const editorRef = ref<InstanceType<typeof EditorContent>>();

const emit = defineEmits<TextishEmits>();

const state = useReflectiveState({
  modelRef: modelValue,
  emit,
  editorRef,
});

const editor = useEditor({
  extensions: [
    HeadingDocument,
    StarterKit.configure({

      document: false,
      paragraph: false,
      heading: {
        levels: [3],
      },
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      hardBreak: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
    }),
    PreventNewline,
  ],
  content: `<h3>${state.editorContent.value}</h3>`,
  onUpdate: (event) => state.handleTipTapUpdateEvent(event),
});

defineExpose(state.expose);
</script>

<style lang="scss" scoped>
@use "../Styles/Mixins.scss" as *;
@include reset-contenteditable;
</style>
