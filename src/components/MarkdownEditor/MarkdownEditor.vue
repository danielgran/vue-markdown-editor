<template>
  <div
    ref="editorContainerRef"
    class="markdown-editor"
    @click="handleClickBlankArea"
    @keydown.capture="handleSlashMenuKeydown"
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
        Click to start writing...
      </p>
    </template>
    <MarkdownEditorTextSelectionContextMenu />
    <MarkdownEditorSlashMenu
      v-if="slashMenuVisible"
      :items="slashMenuItems"
      :active-index="slashMenuActiveIndex"
      :x="slashMenuAnchorX"
      :y="slashMenuAnchorY"
      :anchor="slashMenuAnchor"
      @select="applySlashCommand"
      @update:active-index="setSlashActiveIndex"
    />
  </div>
</template>

<script lang="ts" setup>
import { useSortable } from "@vueuse/integrations/useSortable";
import {
  computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch, type PropType,
} from "vue";
import { provideMarkdownModuleContext } from "@/components/MarkdownEditor/Composable/markdownModuleContext";
import useSlashMenu from "@/components/MarkdownEditor/Composable/useSlashMenu";
import { renderedTextLength } from "@/components/MarkdownEditor/Composable/useReflectiveState";
import type { MarkdownEditorInstance } from "@/components/MarkdownEditor/Composable/useMarkdownEditor";
import MarkdownEditorTextSelectionContextMenu from "@/components/MarkdownEditor/ContextMenu/MarkdownEditorTextSelectionContextMenu.vue";
import MarkdownEditorFocusControls from "@/components/MarkdownEditor/MarkdownEditorFocusControls.vue";
import { isTextNodeState as isTextishNode } from "@/components/MarkdownEditor/MarkdownComponentRegistry";
import MarkdownEditorModule from "@/components/MarkdownEditor/MarkdownEditorModule.vue";
import type MarkdownModuleFileState from "@/components/MarkdownEditor/Modules/MarkdownModuleFileState";
import MarkdownEditorSlashMenu from "@/components/MarkdownEditor/SlashMenu/MarkdownEditorSlashMenu.vue";
import {
  defaultSlashCommands, type SlashCommand,
} from "@/components/MarkdownEditor/SlashMenu/slashCommands";
import type { MarkdownAstNode } from "@/components/MarkdownEditor/Types/MarkdownAstNode";
import MarkdownNodeType from "@/components/MarkdownEditor/Types/MarkdownAstNodeType";

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
  imageUploadFunction: {
    type: Function as PropType<(file: File) => Promise<string>>,
    required: false,
    default: undefined,
  },
  fileUploadFunction: {
    type: Function as PropType<(file: File) => Promise<string>>,
    required: false,
    default: undefined,
  },
  enableSlashCommands: {
    type: Boolean,
    required: false,
    default: true,
  },
  slashCommands: {
    type: Array as PropType<SlashCommand[]>,
    required: false,
    default: () => [...defaultSlashCommands],
  },
});

const emit = defineEmits<{
  (e: "update:focused-node", value: MarkdownAstNode | null): void;
}>();

const {
  markdownNodes, deleteNode, addBlankNode, addNodeWithType, replaceNodeType, splitListNode,
  updateTextNode, splitTextNode, mergeTextNodeIntoPrevious,
} = props.editor;

const editorContainerRef = useTemplateRef("editorContainerRef");
useSortable(() => editorContainerRef.value, markdownNodes, {
  handle: ".drag-handle",
  animation: 150,
});
const focusedNode = ref<MarkdownAstNode | null>(props.focusedNode);

const {
  isVisible: slashMenuVisible,
  items: slashMenuItems,
  activeIndex: slashMenuActiveIndex,
  anchorX: slashMenuAnchorX,
  anchorY: slashMenuAnchorY,
  open: openSlashMenu,
  close: closeSlashMenu,
  setActiveIndex: setSlashActiveIndex,
  handleKeydown: handleSlashMenuKey,
} = useSlashMenu({
  commands: () => props.slashCommands,
  onSelect: applySlashCommand,
});

/** Block content the menu is anchored to, so it follows the block while scrolling. */
const slashMenuAnchor = ref<HTMLElement | null>(null);

/** The text after a leading `/`, or null when the focused block cannot host the menu. */
const slashQuery = computed(() => {
  const node = focusedNode.value;
  if (!node || !isTextishNode(node)) return null;

  const { text } = node.componentState;
  return text.startsWith("/") ? text.slice(1) : null;
});

watch([focusedNode, slashQuery], () => syncSlashMenu());

function syncSlashMenu() {
  const query = slashQuery.value;
  if (!props.enableSlashCommands || query === null) {
    closeSlashMenu();
    return;
  }

  slashMenuAnchor.value = resolveSlashAnchorElement();
  openSlashMenu(query, resolveSlashAnchorPoint());
}

/** The focused block's content, which the menu stays attached to while scrolling. */
function resolveSlashAnchorElement(): HTMLElement | null {
  const node = focusedNode.value;
  const nodeIndex = node ? markdownNodes.value.indexOf(node) : -1;
  const contents = editorContainerRef.value?.querySelectorAll<HTMLElement>(".markdown-editor-module-content");

  return nodeIndex >= 0 ? contents?.[nodeIndex] ?? null : null;
}

/** Puts the menu under the focused block, right of the drag-handle column. */
function resolveSlashAnchorPoint(): { x: number; y: number } {
  const rect = slashMenuAnchor.value?.getBoundingClientRect();

  return rect ? { x: rect.left, y: rect.bottom + 4 } : { x: 0, y: 0 };
}

/** Converts the current block, dropping the `/query` text it was opened with. */
function applySlashCommand(command: SlashCommand) {
  const node = focusedNode.value;
  closeSlashMenu();

  if (!node || !isTextishNode(node)) return;

  const result = replaceNodeType(node, command.type, "");
  if (result) focusNodeByIndex(result.index);
}

function handleSlashMenuKeydown(event: KeyboardEvent) {
  if (!slashMenuVisible.value) return;
  if (!handleSlashMenuKey(event)) return;

  // The menu owns these keys, the block editor must not react to them.
  event.preventDefault();
  event.stopPropagation();
}

function handleDocumentMouseDown(event: MouseEvent) {
  if (!slashMenuVisible.value) return;

  const target = event.target as HTMLElement | null;
  if (target?.closest(".markdown-editor-slash-menu")) return;
  // Clicks inside the editor are left to the focus tracking, which closes the
  // menu only when the caret actually moves into another block.
  if (target?.closest(".markdown-editor")) return;

  closeSlashMenu();
}

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

// Lets modules change editor state directly instead of emitting events upwards.
provideMarkdownModuleContext({
  exitList: (state, itemIndex) => {
    const node = markdownNodes.value.find(candidate => candidate.componentState === state);
    if (!node) return;

    const paragraphIndex = splitListNode(node, itemIndex);
    if (paragraphIndex === null) return;

    focusNodeByIndex(paragraphIndex);
  },
  closeList: (state) => {
    const index = markdownNodes.value.findIndex(candidate => candidate.componentState === state);
    if (index === -1) return;

    focusNodeByIndex(addBlankNode(index));
  },
  splitTextBlock: (state, before, after) => {
    const node = markdownNodes.value.find(candidate => candidate.componentState === state);
    if (!node) return;

    const nodeIndex = markdownNodes.value.indexOf(node);

    // Enter at the end of the text continues writing in a new module below.
    if (after === "") {
      updateTextNode(node, before);
      focusNodeByIndex(addBlankNode(nodeIndex));
      return;
    }

    // Enter on the first character opens an empty module above, leaving the caret
    // in the text so typing continues where the user was.
    if (before === "") {
      updateTextNode(node, after);
      addBlankNode(nodeIndex - 1);
      focusNodeByIndex(nodeIndex + 1);
      return;
    }

    const newIndex = splitTextNode(node, before, after);
    if (newIndex === null) return;

    focusNodeByIndex(newIndex);
  },
  mergeTextBlockBackward: (state) => {
    const node = markdownNodes.value.find(candidate => candidate.componentState === state);
    if (!node) return false;

    const merged = mergeTextNodeIntoPrevious(node);
    if (!merged) return false;

    // The caret ends up where the two blocks are joined, inside the merged block.
    merged.node.editingState.cursorPosition = renderedTextLength(merged.aboveText) + 1;
    focusNodeByIndex(merged.index);
    return true;
  },
  removeBlock: (state) => {
    const index = markdownNodes.value.findIndex(candidate => candidate.componentState === state);
    if (index === -1) return;

    deleteNode(index);

    nextTick(() => {
      const newIndex = index > 0 ? index - 1 : 0;
      focusNodeByIndex(newIndex);
    });
  },
});

function handleKeyDownOnNode(node: MarkdownAstNode, event: KeyboardEvent) {
  const nodeIndex = markdownNodes.value.indexOf(node);

  if (event.key === "Enter") {
    if (node.type !== MarkdownNodeType.LIST) {
      handleEnter(nodeIndex, event);
    }
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

async function handlePaste(event: ClipboardEvent) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const items = clipboardData.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file && props.imageUploadFunction) {
        await props.imageUploadFunction(file).then((url) => {
          const currentNodeIndex = markdownNodes.value.indexOf(focusedNode.value!);

          addNodeWithType(currentNodeIndex + 1, MarkdownNodeType.IMAGE, url);
          nextTick(() => {
            focusedNode.value = getNodeByIndex(currentNodeIndex + 1);
          });
        });
      }
      break; // Only process the first image to avoid duplicates from multiple MIME types
    }
  }

  for (const item of items) {
    if (item.kind === "file" && !item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file && props.fileUploadFunction) {
        const currentNodeIndex = markdownNodes.value.indexOf(focusedNode.value!);
        const newNodeIndex = addNodeWithType(
          currentNodeIndex + 1,
          MarkdownNodeType.FILE,
          JSON.stringify({
            url: "",
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadError: "",
          }),
        );

        nextTick(() => {
          focusedNode.value = getNodeByIndex(newNodeIndex);
        });

        await props.fileUploadFunction(file).then((url) => {
          const node = getNodeByIndex(newNodeIndex);
          if (node && node.type === MarkdownNodeType.FILE) {
            const fileState = node.componentState as MarkdownModuleFileState;
            fileState.url = url;
          }
        }).catch((error) => {
          const node = getNodeByIndex(newNodeIndex);
          if (node && node.type === MarkdownNodeType.FILE) {
            const fileState = node.componentState as MarkdownModuleFileState;
            fileState.uploadError = error instanceof Error ? error.message : "Upload failed";
          }
        });
      }
      break;
    }
  }
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

onMounted(() => {
  document.addEventListener("paste", handlePaste);
  document.addEventListener("mousedown", handleDocumentMouseDown);
});

onUnmounted(() => {
  document.removeEventListener("mousedown", handleDocumentMouseDown);
});

</script>

<style lang="scss" scoped>
.markdown-editor {
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
