<template>
  <div @keydown.enter.stop @keydown.shift-enter.stop>
    <EditorContent :editor="editor" />
  </div>
</template>

<script lang="ts" setup>
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { htmlToMarkdown, markdownToHtml } from "../Composable/useReflectiveState";
import MarkdownModuleListState from "./MarkdownModuleListState";
import MarkdownModuleTextState from "./MarkdownModuleTextState";

const modelValue = defineModel<MarkdownModuleListState>({ required: true });

function itemsToHtml(items: MarkdownModuleTextState[]): string {
  if (items.length === 0) return "<ul><li><p></p></li></ul>";
  return `<ul>${items.map(i => `<li><p>${markdownToHtml(i.text)}</p></li>`).join("")}</ul>`;
}

function htmlToItems(html: string): MarkdownModuleTextState[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const lis = Array.from(div.querySelectorAll("li"));
  if (lis.length === 0) return [new MarkdownModuleTextState({ text: "" })];
  return lis.map(li => new MarkdownModuleTextState({ text: htmlToMarkdown(li.innerHTML) }));
}

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      hardBreak: false,
    }),
  ],
  content: itemsToHtml(modelValue.value.items),
  onUpdate: ({ editor }) => {
    modelValue.value.items = htmlToItems(editor.getHTML());
  },
});

defineExpose({
  focus() {
    editor.value?.commands.focus();
  },
});
</script>

<style lang="scss" scoped>
:deep(.tiptap) {
  ul {
    padding-left: 1.5rem;
    margin: 0;
  }
}
</style>
