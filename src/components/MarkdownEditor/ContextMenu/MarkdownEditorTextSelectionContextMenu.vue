<template>
  <MarkdownEditorContextMenu
    v-if="isVisible"
    :x="anchorX"
    :y="anchorY"
    placement="above"
  >
    <MarkdownEditorContextMenuInlineItem
      :active="activeStates.bold"
      @click="toggleFormat('bold')"
    >
      <strong>B</strong>
    </MarkdownEditorContextMenuInlineItem>

    <MarkdownEditorContextMenuInlineItem
      :active="activeStates.italic"
      @click="toggleFormat('italic')"
    >
      <em>I</em>
    </MarkdownEditorContextMenuInlineItem>

    <MarkdownEditorContextMenuInlineItem
      :active="activeStates.underline"
      @click="toggleFormat('underline')"
    >
      <span style="text-decoration: underline">U</span>
    </MarkdownEditorContextMenuInlineItem>
  </MarkdownEditorContextMenu>
</template>

<script setup lang="ts">
import { activeEditor } from "../Composable/activeEditorStore";
import useTextSelectionMenu from "../Composable/useTextSelectionMenu";
import MarkdownEditorContextMenu from "./MarkdownEditorContextMenu.vue";
import MarkdownEditorContextMenuInlineItem from "./MarkdownEditorContextMenuInlineItem.vue";

const { isVisible, anchorX, anchorY, activeStates, hide } = useTextSelectionMenu();

function toggleFormat(command: "bold" | "italic" | "underline") {
  const editor = activeEditor.value!;

  // Save and restore the ProseMirror selection so the toggle command
  // operates on the correct range even if the browser cleared it.
  const { from, to } = editor.state.selection;

  const commandMap: Record<string, () => boolean> = {
    bold: () => editor.chain().setTextSelection({ from, to }).toggleBold().run(),
    italic: () => editor.chain().setTextSelection({ from, to }).toggleItalic().run(),
    underline: () => editor.chain().setTextSelection({ from, to }).toggleUnderline().run(),
  };

  commandMap[command]?.();
  hide();
}
</script>
