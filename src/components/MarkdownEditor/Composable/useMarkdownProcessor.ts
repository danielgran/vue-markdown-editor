import type { PhrasingContent } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { type ModelRef, nextTick, ref, watch } from "vue";
import MarkdownNodeFactory from "../Factory/MarkdownNodeFactory";
import { isTextNodeState } from "../MarkdownComponentRegistry";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { isTextNodeType } from "../Types/MarkdownAstNodeType";

function useMarkdownProcessor(modelValue: ModelRef<string | undefined>) {
  const markdownNodes = ref<Array<MarkdownAstNode>>([]);
  const isInternalUpdate = ref(false);

  compileMarkdown(modelValue.value ?? "");

  watch(
    markdownNodes,
    () => {
      isInternalUpdate.value = true;
      modelValue.value = serializeMarkdown();
      nextTick(() => {
        isInternalUpdate.value = false;
      });
    },
    { deep: true },
  );

  watch(modelValue, (newValue) => {
    if (isInternalUpdate.value) return;
    markdownNodes.value = [];
    compileMarkdown(newValue ?? "");
  });

  function compileMarkdown(markdown: string) {
    const processor = unified().use(remarkParse);
    const tree = processor.parse(markdown);

    for (const node of tree.children) {
      if (node.type === "paragraph" && node.children[0]?.type === "text") {
        const text = node.children[0].value ?? "";

        // Custom Component Syntax here
        // eslint-disable-next-line @stylistic/quotes
        if (text.startsWith('"""') && text.endsWith('"""')) {
          const moduleName = (text.split("\n")[0] ?? "").slice(3).trim();
          if (moduleName === "MarkdownModuleImage") {
            const srcMatch = text.match(/src:\s*(\S+)/);
            const altMatch = text.match(/alt:\s*(.+)/);
            const captionMatch = text.match(/caption:\s*(.+)/);

            markdownNodes.value.push(
              MarkdownNodeFactory.createImageNode(
                srcMatch?.[1] ?? "",
                altMatch?.[1] ?? "",
                captionMatch?.[1] ?? "",
              ),
            );
            continue;
          }
        }

        // Regular text node

        const phrasingContent = phrasingContentToText(node.children);

        markdownNodes.value.push(MarkdownNodeFactory.createTextNode(MarkdownNodeType.PARAGRAPH, phrasingContent));
      } else if (node.type === "heading" && node.depth === 1) {
        const phrasingContent = phrasingContentToText(node.children);

        markdownNodes.value.push(MarkdownNodeFactory.createTextNode(MarkdownNodeType.HEADLINE1, phrasingContent));
      } else if (node.type === "heading" && node.depth === 2) {
        markdownNodes.value.push(
          MarkdownNodeFactory.createTextNode(MarkdownNodeType.HEADLINE2, phrasingContentToText(node.children)),
        );
      } else if (node.type === "heading" && node.depth === 3) {
        markdownNodes.value.push(
          MarkdownNodeFactory.createTextNode(MarkdownNodeType.HEADLINE3, phrasingContentToText(node.children)),
        );
      }
    }
  }

  function serializeMarkdown(): string {
    return markdownNodes.value
      .map((node) => {
        if (isTextNodeType(node.type)) {
          const prefix = {
            [MarkdownNodeType.PARAGRAPH]: "",
            [MarkdownNodeType.LIST]: "",
            [MarkdownNodeType.HEADLINE1]: "# ",
            [MarkdownNodeType.HEADLINE2]: "## ",
            [MarkdownNodeType.HEADLINE3]: "### ",
          }[node.type];
          return `${prefix}${node.componentState.text}`;
        }
        if (node.type === MarkdownNodeType.IMAGE) {
          return `"""MarkdownModuleImage
src: ${node.componentState.src}
alt: ${node.componentState.alt}
caption: ${node.componentState.caption}
"""`;
        }
        return "";
      })
      .join("\n\n");
  }

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

  function createNodeWithType(text: string, newType: MarkdownNodeType): MarkdownAstNode {
    if (isTextNodeType(newType)) {
      return MarkdownNodeFactory.createTextNode(newType, text);
    } else if (newType === MarkdownNodeType.IMAGE) {
      return MarkdownNodeFactory.createImageNode("", "", "");
    } else {
      throw new Error(`Unsupported node type: ${newType}`);
    }
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
    replaceNodeType,
    moveNode,
  };
}

export default useMarkdownProcessor;

function phrasingContentToText(phrasingContent: PhrasingContent[]): string {
  let result = "";

  for (const content of phrasingContent) {
    if (content.type === "text") {
      result += content.value;
    }
    if (content.type === "strong") {
      result += `**${phrasingContentToText(content.children)}**`;
    }
    if (content.type === "emphasis") {
      result += `*${phrasingContentToText(content.children)}*`;
    }
  }

  return result;
}
