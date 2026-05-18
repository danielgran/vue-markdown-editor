<template>
  <EditorContent
    ref="editorRef"
    :editor="editor"
  />
</template>

<script lang="ts" setup>
import { Placeholder } from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { ref } from "vue";
import useReflectiveState from "../Composable/useReflectiveState";
import { PreventNewline } from "../TipTap/SingleLineExtension";
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
    Placeholder.configure({
      placeholder: "Type something...",
    }),
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      hardBreak: false,
    }),
    PreventNewline,
  ],
  content: state.editorContent.value,
  onUpdate: (event) => state.handleTipTapUpdateEvent(event),
});

defineExpose(state.expose);
</script>

<style lang="scss" scoped>
</style>
