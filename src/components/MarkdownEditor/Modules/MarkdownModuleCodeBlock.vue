<template>
  <div @keydown.enter.stop>
    <EditorContent :editor="editor" />
  </div>
</template>

<script lang="ts" setup>
import { Document } from "@tiptap/extension-document";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { ref, watch } from "vue";
import { activeEditor } from "../Composable/activeEditorStore";
import { useMarkdownModuleContext } from "../Composable/markdownModuleContext";
import { BlockKeys } from "../TipTap/BlockKeys";
import type MarkdownModuleCodeBlockState from "./MarkdownModuleCodeBlockState";

const modelValue = defineModel<MarkdownModuleCodeBlockState>({ required: true });

const editorRef = ref<InstanceType<typeof EditorContent>>();

const moduleContext = useMarkdownModuleContext();

// The module renders exactly one fenced code block, so the editor must not hold
// anything else either: deleting the whole code has to leave a code block behind,
// not turn the block into a paragraph the wrapper knows nothing about.
const CodeBlockDocument = Document.extend({ content: "codeBlock" });

const editor = useEditor({
  extensions: [
    CodeBlockDocument,
    StarterKit.configure({
      document: false,
      heading: false,
      blockquote: false,
      horizontalRule: false,
      hardBreak: false,
      trailingNode: false,
      // The wrapper block owns leaving the code block, so TipTap must not insert an
      // empty block above or below it on arrow keys or a triple Enter. Such a block
      // stays inside the editor and would swallow the caret and any text typed after.
      codeBlock: {
        exitOnArrowDown: false,
        exitOnArrowUp: false,
        exitOnTripleEnter: false,
      },
    }),
    BlockKeys({
      onBackspaceOnEmpty: () => moduleContext.removeBlock(modelValue.value),
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
