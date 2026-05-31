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
import useTextSelectionMenu from "../Composable/useTextSelectionMenu";
import MarkdownEditorContextMenu from "./MarkdownEditorContextMenu.vue";
import MarkdownEditorContextMenuInlineItem from "./MarkdownEditorContextMenuInlineItem.vue";

const { isVisible, anchorX, anchorY, activeStates, hide } = useTextSelectionMenu();

function toggleFormat(command: "bold" | "italic" | "underline") {
  // execCommand applies formatting to the active contenteditable selection.
  // TipTap's onUpdate fires after the DOM change, keeping reactive state consistent.
  document.execCommand(command);
  hide();
}
</script>
