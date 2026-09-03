import { type ModelRef, nextTick, ref, watch } from "vue";
import MarkdownNodeFactory from "../Factory/MarkdownNodeFactory";
import { isTextNodeState } from "../MarkdownComponentRegistry";
import type MarkdownModuleFileState from "../Modules/MarkdownModuleFileState";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { isTextNodeType } from "../Types/MarkdownAstNodeType";
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
    });
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
  };
}

export default useMarkdownProcessor;
