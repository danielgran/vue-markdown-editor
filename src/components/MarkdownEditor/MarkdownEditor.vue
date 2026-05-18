<template>
  <div
    ref="editorContainerRef"
    class="markdown-editor"
    @click="handleClickBlankArea"
    @mouseup="handleMouseUp"
  >
    <MarkdownEditorModule
      v-for="(node, index) in markdownNodes"
      :key="node.id"
      :node="node"
      :focused="focusedNode === node"
      @click.stop
      @keydown="handleKeyDownOnNode(node, $event)"
      @focus="handleFocusOnNode(node)"
      @update:cursor-position="(pos) => handleUpdateCursorPosition(node, pos)"
      @change-type="handleChangeType"
    >
      <template #focus-controls>
        <span
          class="drag-handle"
          title="Drag to reorder"
        >
          ⠿
        </span>
        <button
          type="button"
          tabindex="-1"
          @click="deleteNode(index)"
        >
          🗑️
        </button>
        <button
          type="button"
          tabindex="-1"
          @click="addBlankNode(index)"
        >
          +
        </button>
      </template>
      <template #after-controls>
        <slot name="after-controls" />
      </template>
    </MarkdownEditorModule>

    <MarkdownEditorTextSelectionContextMenu
      v-if="showContextMenu"
      :x="contextMenuPosition.x"
      :y="contextMenuPosition.y"
      :is-active="contextMenuActiveStates"
      @toggle-bold="toggleBold"
      @toggle-italic="toggleItalic"
      @toggle-underline="toggleUnderline"
    />
  </div>
</template>

<script lang="ts" setup>
import { useSortable } from "@vueuse/integrations/useSortable";
import { nextTick, ref, useTemplateRef, type PropType } from "vue";
import type { MarkdownEditorInstance } from "./Composable/useMarkdownEditor";
import MarkdownEditorTextSelectionContextMenu from "./ContextMenu/MarkdownEditorTextSelectionContextMenu.vue";
import { isTextNodeState as isTextishNode } from "./MarkdownComponentRegistry";
import MarkdownEditorModule from "./MarkdownEditorModule.vue";
import type { MarkdownAstNode } from "./Types/MarkdownAstNode";
import type MarkdownNodeType from "./Types/MarkdownAstNodeType";

const props = defineProps({
  editor: {
    type: Object as PropType<MarkdownEditorInstance>,
    required: true,
  },
  focusedNode: {
    type: Object as PropType<MarkdownAstNode | null>,
    required: false,
    default: null,
  },
});

const emit = defineEmits<{
  (e: "update:focused-node", value: MarkdownAstNode | null): void;
}>();

const { markdownNodes, deleteNode, addBlankNode, replaceNodeType, moveNode } = props.editor;

const editorContainerRef = useTemplateRef("editorContainerRef");
useSortable(editorContainerRef, markdownNodes, {
  handle: ".drag-handle",
  animation: 150,
  onUpdate: (e) => {
    moveNode(e.oldIndex!, e.newIndex!);
  },
});
const focusedNode = ref<MarkdownAstNode | null>(props.focusedNode);

// Context menu state
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const contextMenuActiveStates = ref({
  bold: false,
  italic: false,
  underline: false,
});
let selectionDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function handleUpdateCursorPosition(node: MarkdownAstNode, position: number) {
  node.editingState.cursorPosition = position;
}

function handleChangeType(node: MarkdownAstNode, newType: MarkdownNodeType) {
  const result = replaceNodeType(node, newType);

  if (result) {
    if (isTextishNode(result.newNode)) {
      result.newNode.componentState.text = node.componentState.text.slice(node.editingState.cursorPosition);
    }
    focusNodeByIndex(result.index);
  }
}

function handleKeyDownOnNode(node: MarkdownAstNode, event: KeyboardEvent) {
  const nodeIndex = markdownNodes.value.indexOf(node);

  if (event.key === "Enter") {
    handleEnter(nodeIndex, event);
  } else if (event.key === "Backspace") {
    handleBackspace(nodeIndex);
  } else if (event.key === "ArrowUp") {
    moveFocusOneUp();
    event.preventDefault();
  } else if (event.key === "ArrowDown") {
    moveFocusOneDown();
    event.preventDefault();
  } else if (event.key === "Delete") {
    handleDelete(nodeIndex);
  }
}

function handleFocusOnNode(node: MarkdownAstNode) {
  focusedNode.value = node;
  emit("update:focused-node", node);
}

function handleEnter(nodeIndex: number, event: KeyboardEvent) {
  addBlankNode(nodeIndex);
  moveFocusOneDown();
  event.preventDefault();
}

function handleBackspace(index: number) {
  const node = getNodeByIndex(index);

  if (!isTextishNode(node)) return;
  if (node.componentState.text !== "") return;

  deleteNode(index);

  nextTick(() => {
    const newIndex = index > 0 ? index - 1 : 0;
    focusNodeByIndex(newIndex);
  });
}

function handleDelete(index: number) {
  const node = getNodeByIndex(index);

  if (!isTextishNode(node)) return;
  if (node.componentState.text !== "") return;

  deleteNode(index);
  focusNodeByIndex(index);
}

function handleClickBlankArea() {
  const lastNode = markdownNodes.value[markdownNodes.value.length - 1];
  if (lastNode && isTextishNode(lastNode) && lastNode.componentState.text === "") {
    focusedNode.value = lastNode;
    return;
  }

  const newIndex = markdownNodes.value.length;

  addBlankNode(newIndex);
  focusNodeByIndex(newIndex);
}

function focusNodeByIndex(index: number) {
  const node = markdownNodes.value[index];
  if (!node) return;
  nextTick(() => {
    focusedNode.value = node;
  });
}

function getNodeByIndex(index: number): MarkdownAstNode {
  const node = markdownNodes.value[index];
  if (!node) throw new Error("Node not found at index " + index);
  return node;
}

function moveFocusOneUp() {
  if (!focusedNode.value) return;

  nextTick(() => {
    const currentNode = focusedNode.value;
    if (!currentNode) return;

    const index = markdownNodes.value.indexOf(currentNode);
    if (index > 0) {
      focusedNode.value = getNodeByIndex(index - 1);
    }
  });
}

function moveFocusOneDown() {
  if (!focusedNode.value) return;

  nextTick(() => {
    const currentNode = focusedNode.value;
    if (!currentNode) return;
    const index = markdownNodes.value.indexOf(currentNode);
    if (index < markdownNodes.value.length - 1) {
      focusedNode.value = getNodeByIndex(index + 1);
    }
  });
}

// Context menu handlers
function handleMouseUp() {
  // Clear existing timer
  if (selectionDebounceTimer) {
    clearTimeout(selectionDebounceTimer);
  }

  const selection = window.getSelection();

  if (!selection || selection.isCollapsed || selection.toString().trim() === "") {
    showContextMenu.value = false;
    return;
  }

  // Debounce: wait 500ms before showing context menu
  selectionDebounceTimer = setTimeout(() => {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position the context menu above the selection
    contextMenuPosition.value = {
      x: rect.left + rect.width / 2 - 75, // Center and offset
      y: rect.top - 50, // Position above selection
    };

    // Detect active formatting states
    const parentElement = range.commonAncestorContainer.parentElement;
    if (parentElement) {
      contextMenuActiveStates.value = {
        bold: isElementOrParentTagName(parentElement, ["STRONG", "B"]),
        italic: isElementOrParentTagName(parentElement, ["EM", "I"]),
        underline: isElementOrParentTagName(parentElement, ["U"]),
      };
    }

    showContextMenu.value = true;
  }, 500);
}

function isElementOrParentTagName(element: HTMLElement, tagNames: string[]): boolean {
  let current: HTMLElement | null = element;
  while (current) {
    if (tagNames.includes(current.tagName)) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function toggleBold() {
  document.execCommand("bold");
  showContextMenu.value = false;
}

function toggleItalic() {
  document.execCommand("italic");
  showContextMenu.value = false;
}

function toggleUnderline() {
  document.execCommand("underline");
  showContextMenu.value = false;
}
</script>

<style>
/* Basic global style  */
p {
  margin: 0.5rem 0;
}

strong,
b {
  font-weight: bold;
}

em,
i {
  font-style: italic;
}

code {
  font-family: monospace;
  background: rgba(127, 127, 127, 0.15);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-size: 0.9em;
  color: green;
}

h1 {
  font-size: 2em;
  margin: 0;
}

h2 {
  font-size: 1.5em;
  margin: 0;
}

h3 {
  font-size: 1.17em;
  margin: 0;
}
</style>
