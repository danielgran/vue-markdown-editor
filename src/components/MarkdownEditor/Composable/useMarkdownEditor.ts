import { type ModelRef, ref } from "vue";
import useMarkdownProcessor from "./useMarkdownProcessor";

export function useMarkdownEditor(initialContent: string = "") {
  const markdownContent = ref<string>(initialContent);

  const { markdownNodes, deleteNode, addBlankNode, addNodeWithType, replaceNodeType, moveNode } = useMarkdownProcessor(
    markdownContent as ModelRef<string | undefined>,
  );

  return {
    markdownContent,
    markdownNodes,
    deleteNode,
    addBlankNode,
    addNodeWithType,
    replaceNodeType,
    moveNode,
  };
}

export type MarkdownEditorInstance = ReturnType<typeof useMarkdownEditor>;
