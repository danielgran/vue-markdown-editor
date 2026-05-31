<template>
  <div
    ref="editorContainerRef"
    class="markdown-editor"
    @click="handleClickBlankArea"
  >
  <template v-if="markdownNodes.length > 0">
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
        <MarkdownEditorFocusControls
          @delete="deleteNode(index)"
          @add="addBlankNode(index)"
        />
      </template>
      <template #after-controls>
        <!-- Additional controls can be added here -->
        <slot name="after-controls" />
      </template>
    </MarkdownEditorModule>
  </template>
  <template v-else>
    <p
      class="text-gray-500 italic"
    >
      Click here to start writing...
    </p>
  </template>
    <MarkdownEditorTextSelectionContextMenu />
  </div>
</template>

<script lang="ts" setup>
import { useSortable } from "@vueuse/integrations/useSortable";
import { nextTick, ref, useTemplateRef, type PropType } from "vue";
import type { MarkdownEditorInstance } from "./Composable/useMarkdownEditor";
import MarkdownEditorTextSelectionContextMenu from "./ContextMenu/MarkdownEditorTextSelectionContextMenu.vue";
import MarkdownEditorFocusControls from "./MarkdownEditorFocusControls.vue";
import { isTextNodeState as isTextishNode } from "./MarkdownComponentRegistry";
import MarkdownEditorModule from "./MarkdownEditorModule.vue";
import type { MarkdownAstNode } from "./Types/MarkdownAstNode";
import MarkdownNodeType from "./Types/MarkdownAstNodeType";

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

const { markdownNodes, deleteNode, addBlankNode, replaceNodeType } = props.editor;

const editorContainerRef = useTemplateRef("editorContainerRef");
useSortable(() => editorContainerRef.value, markdownNodes, {
  handle: ".drag-handle",
  animation: 150,
});
const focusedNode = ref<MarkdownAstNode | null>(props.focusedNode);

function handleUpdateCursorPosition(node: MarkdownAstNode, position: number) {
  node.editingState.cursorPosition = position;
}

function handleChangeType(node: MarkdownAstNode, newType: MarkdownNodeType) {
  const result = replaceNodeType(node, newType);

  if (result) {
    if (isTextishNode(result.newNode) && isTextishNode(node)) {
      result.newNode.componentState.text = node.componentState.text.slice(node.editingState.cursorPosition);
    }
    focusNodeByIndex(result.index);
  }
}

function handleKeyDownOnNode(node: MarkdownAstNode, event: KeyboardEvent) {
  const nodeIndex = markdownNodes.value.indexOf(node);

  if (event.key === "Enter") {
    if (node.type !== MarkdownNodeType.LIST) {
      handleEnter(nodeIndex, event);
    }
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


</script>

<style lang="scss" scoped>
.markdown-editor {
  padding-left: 6rem;

  :deep(p) {
    margin: 0.5rem 0;
  }

  :deep(strong),
  :deep(b) {
    font-weight: bold;
  }

  :deep(em),
  :deep(i) {
    font-style: italic;
  }

  :deep(code) {
    font-family: monospace;
    background: rgba(127, 127, 127, 0.15);
    padding: 0.1em 0.3em;
    border-radius: 3px;
    font-size: 0.9em;
    color: green;
  }

  :deep(h1) {
    font-size: 2em;
    margin: 0;
  }

  :deep(h2) {
    font-size: 1.5em;
    margin: 0;
  }

  :deep(h3) {
    font-size: 1.17em;
    margin: 0;
  }
}
</style>
