import { type ModelRef, ref } from "vue";
import useMarkdownProcessor from "./useMarkdownProcessor";

export function useMarkdownEditor(initialContent: string = "") {
  const markdownContent = ref<string>(initialContent);

  const {
    markdownNodes, deleteNode, addBlankNode, addNodeWithType, replaceNodeType, moveNode,
    splitListNode, splitTextNode, mergeTextNodeIntoPrevious,
  } = useMarkdownProcessor(markdownContent as ModelRef<string | undefined>);

  return {
    markdownContent,
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

export type MarkdownEditorInstance = ReturnType<typeof useMarkdownEditor>;
