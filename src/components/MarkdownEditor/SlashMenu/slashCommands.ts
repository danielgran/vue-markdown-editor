import MarkdownNodeType from "../Types/MarkdownAstNodeType";

/**
 * One entry of the slash menu. Commands are plain data, so applications can add
 * their own block types by passing an extended list to `<MarkdownEditor>`.
 */
export interface SlashCommand {
  /** Stable identifier, also used as a search term. */
  id: string;
  /** Label shown in the menu. */
  title: string;
  /** Optional hint shown below the title. */
  description?: string;
  /** Short glyph rendered before the title. */
  icon?: string;
  /** Extra search terms besides the title and id. */
  keywords?: string[];
  /** Block type the current block is converted into when the command is picked. */
  type: MarkdownNodeType;
}

export const defaultSlashCommands: SlashCommand[] = [
  {
    id: "paragraph",
    title: "Text",
    description: "Plain paragraph",
    icon: "¶",
    keywords: ["paragraph", "body", "p"],
    type: MarkdownNodeType.PARAGRAPH,
  },
  {
    id: "heading1",
    title: "Heading 1",
    description: "Largest section heading",
    icon: "H1",
    keywords: ["h1", "title", "headline"],
    type: MarkdownNodeType.HEADLINE1,
  },
  {
    id: "heading2",
    title: "Heading 2",
    description: "Medium section heading",
    icon: "H2",
    keywords: ["h2", "subtitle", "headline"],
    type: MarkdownNodeType.HEADLINE2,
  },
  {
    id: "heading3",
    title: "Heading 3",
    description: "Small section heading",
    icon: "H3",
    keywords: ["h3", "headline"],
    type: MarkdownNodeType.HEADLINE3,
  },
  {
    id: "bulletList",
    title: "Bullet list",
    description: "Unordered list of items",
    icon: "•",
    keywords: ["unordered", "ul", "list", "bullet"],
    type: MarkdownNodeType.LIST,
  },
  {
    id: "orderedList",
    title: "Numbered list",
    description: "Ordered list of items",
    icon: "1.",
    keywords: ["ordered", "ol", "list", "number"],
    type: MarkdownNodeType.ORDERED_LIST,
  },
  {
    id: "blockquote",
    title: "Quote",
    description: "Capture a quotation",
    icon: "❝",
    keywords: ["blockquote", "citation", "quote"],
    type: MarkdownNodeType.BLOCKQUOTE,
  },
  {
    id: "codeBlock",
    title: "Code block",
    description: "Fenced code with a language",
    icon: "</>",
    keywords: ["code", "fence", "snippet", "pre"],
    type: MarkdownNodeType.CODE_BLOCK,
  },
  {
    id: "divider",
    title: "Divider",
    description: "Horizontal rule",
    icon: "―",
    keywords: ["hr", "separator", "rule", "divider"],
    type: MarkdownNodeType.HR,
  },
  {
    id: "table",
    title: "Table",
    description: "Grid of cells",
    icon: "▦",
    keywords: ["grid", "cells", "table"],
    type: MarkdownNodeType.TABLE,
  },
  {
    id: "image",
    title: "Image",
    description: "Embed an image block",
    icon: "▣",
    keywords: ["picture", "photo", "img", "image"],
    type: MarkdownNodeType.IMAGE,
  },
];

/** Commands whose id, title or keywords contain the query, in their original order. */
export function filterSlashCommands(commands: SlashCommand[], query: string): SlashCommand[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "") return commands;

  return commands.filter((command) => {
    const haystack = [command.id, command.title, ...(command.keywords ?? [])]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}
