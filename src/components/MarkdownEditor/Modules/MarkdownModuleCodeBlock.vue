<template>
  <div @keydown.enter.stop @keydown.shift-enter.stop>
    <EditorContent :editor="editor" />
  </div>
</template>

<script lang="ts" setup>
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { ref, watch } from "vue";
import { activeEditor } from "../Composable/activeEditorStore";
import type MarkdownModuleCodeBlockState from "./MarkdownModuleCodeBlockState";

const modelValue = defineModel<MarkdownModuleCodeBlockState>({ required: true });

const editorRef = ref<InstanceType<typeof EditorContent>>();

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      horizontalRule: false,
      hardBreak: false,
    }),
  ],
  content: `<pre><code>${modelValue.value.code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`,
  onFocus: () => {
    activeEditor.value = editor.value ?? null;
  },
  onUpdate: ({ editor }) => {
    modelValue.value.code = editor.getText();
  },
});

watch(
  () => modelValue.value.code,
  (code) => {
    if (editor.value && editor.value.getText() !== code) {
      editor.value.commands.setContent(`<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`);
    }
  },
);

function focus() {
  editor.value?.commands.focus();
}

defineExpose({ focus, editor, editorRef });
</script>

<style lang="scss" scoped>
:deep(.tiptap) {
  pre {
    background: #1f2937;
    color: #f9fafb;
    border-radius: 0.25rem;
    padding: 0.75rem 1rem;
    overflow-x: auto;

    code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
  }
}
</style>
