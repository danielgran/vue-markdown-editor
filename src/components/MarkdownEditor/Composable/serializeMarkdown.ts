import { isTextNodeState } from "../MarkdownComponentRegistry";
import type MarkdownModuleFileState from "../Modules/MarkdownModuleFileState";
import type MarkdownModuleImageState from "../Modules/MarkdownModuleImageState";
import type MarkdownModuleListState from "../Modules/MarkdownModuleListState";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType, { isTextNodeType } from "../Types/MarkdownAstNodeType";

export function serializeMarkdown(nodes: MarkdownAstNode[]): string {
  return nodes
    .map((node) => {
      if (isTextNodeType(node.type) && isTextNodeState(node)) {
        const prefix = {
          [MarkdownNodeType.PARAGRAPH]: "",
          [MarkdownNodeType.LIST]: "",
          [MarkdownNodeType.HEADLINE1]: "# ",
          [MarkdownNodeType.HEADLINE2]: "## ",
          [MarkdownNodeType.HEADLINE3]: "### ",
        }[node.type];
        return `${prefix}${node.componentState.text}`;
      }
      if (node.type === MarkdownNodeType.LIST) {
        const listState = node.componentState as MarkdownModuleListState;
        return listState.items.map(item => `- ${item.text}`).join("\n");
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
