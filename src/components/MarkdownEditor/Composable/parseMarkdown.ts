import type { Blockquote, List as MdastList, Paragraph, PhrasingContent, Table as MdastTable } from "mdast";
import remarkGfmDefault from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import MarkdownNodeFactory from "../Factory/MarkdownNodeFactory";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { isTextNodeType } from "../Types/MarkdownAstNodeType";

// Normalize the remark-gfm export across ESM/CJS bundler interop.
const remarkGfm = (remarkGfmDefault as unknown as { default?: typeof remarkGfmDefault }).default ?? remarkGfmDefault;

export function parseMarkdown(markdown: string): MarkdownAstNode[] {
  const nodes: MarkdownAstNode[] = [];
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown);

  for (const node of tree.children) {
    if (node.type === "paragraph" && node.children[0]?.type === "text") {
      const firstText = node.children[0].value ?? "";

      // Custom Component Syntax here. remark-gfm auto-links bare URLs (e.g. the
      // image `src:` or file `url:` fields), which splits a """...""" module block
      // into several children. Reassemble the raw text across all children first,
      // so the opening/closing triple quotes and the field regexes still match.
      // eslint-disable-next-line @stylistic/quotes
      if (firstText.startsWith('"""')) {
        const blockText = paragraphChildrenToRawText(node.children).trim();

        // eslint-disable-next-line @stylistic/quotes
        if (blockText.startsWith('"""') && blockText.endsWith('"""')) {
          const moduleName = (blockText.split("\n")[0] ?? "").slice(3).trim();
          if (moduleName === "MarkdownModuleImage") {
            const srcMatch = blockText.match(/src:\s*(\S+)/);
            const altMatch = blockText.match(/alt:\s*(.+)/);
            const captionMatch = blockText.match(/caption:\s*(.+)/);

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
            const urlMatch = blockText.match(/url:\s*(\S+)/);
            const fileNameMatch = blockText.match(/fileName:\s*(.+)/);
            const fileSizeMatch = blockText.match(/fileSize:\s*(\d+)/);
            const mimeTypeMatch = blockText.match(/mimeType:\s*(.+)/);

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
    } else if (node.type === "blockquote") {
      const content = blockquoteContentToText(node.children);
      nodes.push(MarkdownNodeFactory.createBlockquoteNode(content));
    } else if (node.type === "code") {
      nodes.push(MarkdownNodeFactory.createCodeBlockNode(node.value ?? "", node.lang ?? ""));
    } else if (node.type === "thematicBreak") {
      nodes.push(MarkdownNodeFactory.createHrNode());
    } else if (node.type === "list" && node.ordered) {
      const items = listNodeToItems(node.children);
      nodes.push(MarkdownNodeFactory.createOrderedListNode(items));
    } else if (node.type === "list") {
      const items = listNodeToItems(node.children);
      nodes.push(MarkdownNodeFactory.createListNode(items));
    } else if (node.type === "table") {
      nodes.push(MarkdownNodeFactory.createTableNode(...tableNodeToState(node)));
    }
  }

  return nodes;
}

function listNodeToItems(listItems: MdastList["children"]): string[] {
  return listItems.map((listItem) => {
    const firstParagraph = listItem.children.find(c => c.type === "paragraph") as Paragraph | undefined;
    if (firstParagraph) {
      return phrasingContentToText(firstParagraph.children);
    }
    return "";
  });
}

/**
 * Reassembles the raw literal text of a paragraph by concatenating every
 * descendant text value in document order (without re-adding Markdown
 * formatting markers). remark-gfm turns bare URLs inside """...""" module blocks
 * into `link` nodes whose only text child equals the URL, so this restores the
 * original block content exactly, even when the block was split across children.
 */
function paragraphChildrenToRawText(children: PhrasingContent[]): string {
  let result = "";

  for (const content of children) {
    if (content.type === "text") {
      result += content.value;
    } else if ("children" in content && Array.isArray(content.children)) {
      result += paragraphChildrenToRawText(content.children as PhrasingContent[]);
    }
  }

  return result;
}

function blockquoteContentToText(children: Blockquote["children"]): string {
  return children
    .filter(c => c.type === "paragraph")
    .map(c => phrasingContentToText((c as Paragraph).children))
    .join("\n\n");
}

function tableNodeToState(table: MdastTable): [string[], string[][]] {
  const rows = table.children.map((row) => {
    const cells = row.children.map((cell) => phrasingContentToText(cell.children ?? []));
    return cells;
  });

  const headers = rows[0] ?? [];
  const bodyRows = rows.slice(1);
  return [headers, bodyRows];
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
    if (content.type === "inlineCode") {
      result += `\`${content.value}\``;
    }
    if (content.type === "link") {
      result += `[${phrasingContentToText(content.children)}](${content.url})`;
    }
    if (content.type === "delete") {
      result += `~~${phrasingContentToText(content.children)}~~`;
    }
  }

  return result;
}
