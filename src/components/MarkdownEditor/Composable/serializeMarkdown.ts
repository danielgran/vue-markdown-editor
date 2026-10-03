import { isTextNodeState } from "../MarkdownComponentRegistry";
import type MarkdownModuleCodeBlockState from "../Modules/MarkdownModuleCodeBlockState";
import type MarkdownModuleFileState from "../Modules/MarkdownModuleFileState";
import type MarkdownModuleImageState from "../Modules/MarkdownModuleImageState";
import type MarkdownModuleListState from "../Modules/MarkdownModuleListState";
import type MarkdownModuleTableState from "../Modules/MarkdownModuleTableState";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { isTextNodeType } from "../Types/MarkdownAstNodeType";

export function serializeMarkdown(nodes: MarkdownAstNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === MarkdownNodeType.BLOCKQUOTE && isTextNodeState(node)) {
        return node.componentState.text
          .split("\n")
          .map(line => `> ${line}`)
          .join("\n");
      }
      if (isTextNodeType(node.type) && isTextNodeState(node)) {
        const prefixMap: Partial<Record<MarkdownNodeType, string>> = {
          [MarkdownNodeType.PARAGRAPH]: "",
          [MarkdownNodeType.LIST]: "",
          [MarkdownNodeType.HEADLINE1]: "# ",
          [MarkdownNodeType.HEADLINE2]: "## ",
          [MarkdownNodeType.HEADLINE3]: "### ",
        };
        return `${prefixMap[node.type] ?? ""}${node.componentState.text}`;
      }
      if (node.type === MarkdownNodeType.LIST || node.type === MarkdownNodeType.ORDERED_LIST) {
        const listState = node.componentState as MarkdownModuleListState;
        if (node.type === MarkdownNodeType.ORDERED_LIST) {
          return listState.items.map((item, index) => `${index + 1}. ${item.text}`).join("\n");
        }
        return listState.items.map(item => `- ${item.text}`).join("\n");
      }
      if (node.type === MarkdownNodeType.CODE_BLOCK) {
        const codeState = node.componentState as MarkdownModuleCodeBlockState;
        const fence = "```";
        return `${fence}${codeState.language}\n${codeState.code}\n${fence}`;
      }
      if (node.type === MarkdownNodeType.HR) {
        return "---";
      }
      if (node.type === MarkdownNodeType.TABLE) {
        const tableState = node.componentState as MarkdownModuleTableState;
        return serializeTable(tableState);
      }
      if (node.type === MarkdownNodeType.IMAGE) {
        const imageState = node.componentState as MarkdownModuleImageState;
        return `"""MarkdownModuleImage
src: ${imageState.src}
alt: ${imageState.alt}
caption: ${imageState.caption}
"""`;
      }
      if (node.type === MarkdownNodeType.FILE) {
        const fileState = node.componentState as MarkdownModuleFileState;
        return `"""MarkdownModuleFile
url: ${fileState.url}
fileName: ${fileState.fileName}
fileSize: ${fileState.fileSize}
mimeType: ${fileState.mimeType}
"""`;
      }
      return "";
    })
    .join("\n\n");
}

function serializeTable(state: MarkdownModuleTableState): string {
  const rows: string[] = [];
  if (state.headers.length > 0) {
    rows.push(`| ${state.headers.join(" | ")} |`);
    rows.push(`| ${state.headers.map(() => "---").join(" | ")} |`);
  }
  for (const row of state.rows) {
    rows.push(`| ${row.join(" | ")} |`);
  }
  return rows.join("\n");
}
