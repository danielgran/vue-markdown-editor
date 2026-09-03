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
import { activeEditor } from "../Composable/activeEditorStore";
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
      placeholder: "Type a quote...",
    }),
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      horizontalRule: false,
      hardBreak: false,
      blockquote: {
        HTMLAttributes: {
          class: "markdown-module-blockquote",
        },
      },
    }),
    PreventNewline,
  ],
  content: state.editorContent.value,
  onFocus: () => {
    activeEditor.value = editor.value ?? null;
  },
  onUpdate: (event) => state.handleTipTapUpdateEvent(event),
});

defineExpose({ ...state.expose, editor });
</script>

<style lang="scss" scoped>
:deep(.markdown-module-blockquote) {
  border-left: 3px solid #6b7280;
  padding-left: 1rem;
  margin: 0;
  font-style: italic;
}
</style>
