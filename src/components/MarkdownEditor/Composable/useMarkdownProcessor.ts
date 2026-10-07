import {
  type ModelRef, nextTick, ref, watch,
} from "vue";
import MarkdownNodeFactory from "../Factory/MarkdownNodeFactory";
import { isTextNodeState } from "../MarkdownComponentRegistry";
import type MarkdownModuleFileState from "../Modules/MarkdownModuleFileState";
import type MarkdownModuleListState from "../Modules/MarkdownModuleListState";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { isHeadlineNodeType, isTextNodeType } from "../Types/MarkdownAstNodeType";
import { parseMarkdown } from "./parseMarkdown";
import { serializeMarkdown } from "./serializeMarkdown";

function useMarkdownProcessor(modelValue: ModelRef<string | undefined>) {
  const markdownNodes = ref<Array<MarkdownAstNode>>([]);
  const isInternalUpdate = ref(false);

  markdownNodes.value = parseMarkdown(modelValue.value ?? "");

  watch(
    markdownNodes,
    () => {
      isInternalUpdate.value = true;
      modelValue.value = serializeMarkdown(markdownNodes.value);
      nextTick(() => {
        isInternalUpdate.value = false;
      });
    },
    { deep: true },
  );

  watch(modelValue, (newValue) => {
    if (isInternalUpdate.value) return;
    markdownNodes.value = parseMarkdown(newValue ?? "");
  });

  function deleteNode(nodeIndex: number) {
    nextTick(() => {
      markdownNodes.value.splice(nodeIndex, 1);
      mergeAdjacentLists();
    });
  }

  /**
   * Merges lists of the same type that ended up next to each other (for
   * example after the empty paragraph between two split lists is deleted).
   */
  function mergeAdjacentLists() {
    const listTypes = [MarkdownNodeType.LIST, MarkdownNodeType.ORDERED_LIST];

    for (let index = 0; index < markdownNodes.value.length - 1;) {
      const current = markdownNodes.value[index];
      const next = markdownNodes.value[index + 1];

      if (current.type === next.type && listTypes.includes(current.type)) {
        const currentState = current.componentState as MarkdownModuleListState;
        const nextState = next.componentState as MarkdownModuleListState;
        currentState.items = [...currentState.items, ...nextState.items];
        markdownNodes.value.splice(index + 1, 1);
      } else {
        index += 1;
      }
    }
  }

  /**
   * Closes a list at `itemIndex`, replacing it with the items before, an empty
   * paragraph and the items after. Returns the index of the new paragraph.
   */
  function splitListNode(node: MarkdownAstNode, itemIndex: number): number | null {
    const nodeIndex = markdownNodes.value.indexOf(node);
    if (nodeIndex === -1) return null;

    const listState = node.componentState as MarkdownModuleListState;
    if (itemIndex < 0 || itemIndex >= listState.items.length) return null;

    const beforeTexts = listState.items.slice(0, itemIndex).map(item => item.text);
    const afterTexts = listState.items.slice(itemIndex + 1).map(item => item.text);

    const replacement: MarkdownAstNode[] = [];
    if (beforeTexts.length > 0) replacement.push(createListLikeNode(node.type, beforeTexts));
    replacement.push(MarkdownNodeFactory.createBlankParagraph());
    if (afterTexts.length > 0) replacement.push(createListLikeNode(node.type, afterTexts));

    markdownNodes.value.splice(nodeIndex, 1, ...replacement);

    // The paragraph sits right after the first list half, when there is one.
    return nodeIndex + (beforeTexts.length > 0 ? 1 : 0);
  }

  /**
   * Splits a text node at the caret: the node is replaced by `before` (a fresh
   * instance, so the module re-renders the shortened content) and `after` moves
   * into a new node right after it. A headline continues as a paragraph, like
   * Notion, every other block keeps its own type. Returns the new node index.
   */
  function splitTextNode(node: MarkdownAstNode, before: string, after: string): number | null {
    const nodeIndex = markdownNodes.value.indexOf(node);
    if (nodeIndex === -1) return null;
    if (!isTextNodeState(node) || !isTextNodeType(node.type)) return null;

    const continuationType = isHeadlineNodeType(node.type) ? MarkdownNodeType.PARAGRAPH : node.type;

    markdownNodes.value.splice(
      nodeIndex,
      1,
      MarkdownNodeFactory.createTextNode(node.type, before),
      MarkdownNodeFactory.createTextNode(continuationType, after),
    );

    return nodeIndex + 1;
  }

  /**
   * Appends a text node to the text node above it, which keeps its own type, and
   * removes the node itself. Returns the merged node together with the markdown
   * it took over from above, or null when there is no text block above.
   */
  function mergeTextNodeIntoPrevious(
    node: MarkdownAstNode,
  ): { node: MarkdownAstNode; index: number; aboveText: string } | null {
    const nodeIndex = markdownNodes.value.indexOf(node);
    if (nodeIndex <= 0) return null;
    if (!isTextNodeState(node) || !isTextNodeType(node.type)) return null;

    const previous = markdownNodes.value[nodeIndex - 1];
    if (!previous || !isTextNodeState(previous) || !isTextNodeType(previous.type)) return null;

    const aboveText = previous.componentState.text;
    const merged = MarkdownNodeFactory.createTextNode(previous.type, aboveText + node.componentState.text);

    markdownNodes.value.splice(nodeIndex - 1, 2, merged);

    return {
      node: merged, index: nodeIndex - 1, aboveText,
    };
  }

  function createListLikeNode(type: MarkdownNodeType, texts: string[]): MarkdownAstNode {
    return type === MarkdownNodeType.ORDERED_LIST
      ? MarkdownNodeFactory.createOrderedListNode(texts)
      : MarkdownNodeFactory.createListNode(texts);
  }

  function addBlankNode(nodeIndex: number) {
    const newNode = MarkdownNodeFactory.createBlankParagraph();

    if (nodeIndex !== undefined) {
      markdownNodes.value.splice(nodeIndex + 1, 0, newNode);
    } else {
      markdownNodes.value.push(newNode);
    }

    return nodeIndex + 1;
  }

  function addNodeWithType(nodeIndex: number, type: MarkdownNodeType, content: string = ""): number {
    const newNode = createNodeWithType(content, type);

    if (nodeIndex !== undefined) {
      markdownNodes.value.splice(nodeIndex + 1, 0, newNode);
    } else {
      markdownNodes.value.push(newNode);
    }

    return nodeIndex + 1;
  }

  function createNodeWithType(text: string, newType: MarkdownNodeType): MarkdownAstNode {
    if (newType === MarkdownNodeType.LIST) {
      return MarkdownNodeFactory.createListNode(text ? [text] : [""]);
    }
    if (newType === MarkdownNodeType.ORDERED_LIST) {
      return MarkdownNodeFactory.createOrderedListNode(text ? [text] : [""]);
    }
    if (isTextNodeType(newType)) {
      return MarkdownNodeFactory.createTextNode(newType, text);
    }
    if (newType === MarkdownNodeType.CODE_BLOCK) {
      return MarkdownNodeFactory.createCodeBlockNode(text, "");
    }
    if (newType === MarkdownNodeType.HR) {
      return MarkdownNodeFactory.createHrNode();
    }
    if (newType === MarkdownNodeType.TABLE) {
      return MarkdownNodeFactory.createTableNode(["", ""], [["", ""]]);
    }
    if (newType === MarkdownNodeType.IMAGE) {
      return MarkdownNodeFactory.createImageNode(text, "", "");
    }
    if (newType === MarkdownNodeType.FILE) {
      const data = JSON.parse(text) as MarkdownModuleFileState;
      return MarkdownNodeFactory.createFileNode(
        data.url,
        data.fileName,
        data.fileSize,
        data.mimeType,
        data.uploadError,
      );
    }
    throw new Error(`Unsupported node type: ${newType}`);
  }

  function replaceNodeType(
    node: MarkdownAstNode,
    newType: MarkdownNodeType,
  ): { newNode: MarkdownAstNode; index: number } | null {
    // If the node is already of the desired type, do nothing
    if (node.type === newType) return null;

    const nodeIndex = markdownNodes.value.indexOf(node);
    if (nodeIndex === -1) return null;

    const currentText = isTextNodeState(node) ? node.componentState.text : "";
    const newNode = createNodeWithType(currentText, newType);

    markdownNodes.value.splice(nodeIndex, 1, newNode);

    return { newNode, index: nodeIndex };
  }

  function moveNode(fromIndex: number, toIndex: number) {
    const [node] = markdownNodes.value.splice(fromIndex, 1);
    if (node) markdownNodes.value.splice(toIndex, 0, node);
  }

  return {
    markdownNodes,
    deleteNode,
    addBlankNode,
    addNodeWithType,
    replaceNodeType,
    moveNode,
    splitListNode,
    splitTextNode,
    mergeTextNodeIntoPrevious,
  };
}

export default useMarkdownProcessor;
