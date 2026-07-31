import type { PhrasingContent } from "mdast";
import remarkParse from "remark-parse";
import { unified } from "unified";
import MarkdownNodeFactory from "../Factory/MarkdownNodeFactory";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { isTextNodeType } from "../Types/MarkdownAstNodeType";

export function parseMarkdown(markdown: string): MarkdownAstNode[] {
  const nodes: MarkdownAstNode[] = [];
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

          nodes.push(
            MarkdownNodeFactory.createImageNode(
              srcMatch?.[1] ?? "",
              altMatch?.[1] ?? "",
              captionMatch?.[1] ?? "",
            ),
          );
          continue;
        }
        if (moduleName === "MarkdownModuleFile") {
          const urlMatch = text.match(/url:\s*(\S+)/);
          const fileNameMatch = text.match(/fileName:\s*(.+)/);
          const fileSizeMatch = text.match(/fileSize:\s*(\d+)/);
          const mimeTypeMatch = text.match(/mimeType:\s*(.+)/);

          nodes.push(
            MarkdownNodeFactory.createFileNode(
              urlMatch?.[1] ?? "",
              fileNameMatch?.[1] ?? "",
              parseInt(fileSizeMatch?.[1] ?? "0", 10),
              mimeTypeMatch?.[1] ?? "",
            ),
          );
          continue;
        }
      }

      // Regular text node
      const phrasingContent = phrasingContentToText(node.children);
      nodes.push(MarkdownNodeFactory.createTextNode(MarkdownNodeType.PARAGRAPH, phrasingContent));
    } else if (node.type === "heading" && node.depth === 1) {
      const phrasingContent = phrasingContentToText(node.children);
      nodes.push(MarkdownNodeFactory.createTextNode(MarkdownNodeType.HEADLINE1, phrasingContent));
    } else if (node.type === "heading" && node.depth === 2) {
      nodes.push(
        MarkdownNodeFactory.createTextNode(MarkdownNodeType.HEADLINE2, phrasingContentToText(node.children)),
      );
    } else if (node.type === "heading" && node.depth === 3) {
      nodes.push(
        MarkdownNodeFactory.createTextNode(MarkdownNodeType.HEADLINE3, phrasingContentToText(node.children)),
      );
    } else if (node.type === "list") {
      const items = node.children.map((listItem) => {
        const firstParagraph = listItem.children.find(c => c.type === "paragraph");
        if (firstParagraph && firstParagraph.type === "paragraph") {
          return phrasingContentToText(firstParagraph.children);
        }
        return "";
      });
      nodes.push(MarkdownNodeFactory.createListNode(items));
    }
  }

  return nodes;
}

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
