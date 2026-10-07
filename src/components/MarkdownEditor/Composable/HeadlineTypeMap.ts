import MarkdownNodeType from "../Types/MarkdownAstNodeType";

export interface HeadlineTypeEntry {
  prefix: string;
  type: MarkdownNodeType;
  depth: number;
}

export const HEADLINE_TYPE_MAP: HeadlineTypeEntry[] = [
  {
    prefix: "###",
    type: MarkdownNodeType.HEADLINE3,
    depth: 3,
  },
  {
    prefix: "##",
    type: MarkdownNodeType.HEADLINE2,
    depth: 2,
  },
  {
    prefix: "#",
    type: MarkdownNodeType.HEADLINE1,
    depth: 1,
  },
];

/**
 * Block types converted from a leading prefix that do not use the headline
 * cursor heuristic. Typing these prefixes at the start of a paragraph converts
 * the block (e.g. `> ` → blockquote, a code fence → code block).
 */
const NON_HEADING_BLOCK_MAP: HeadlineTypeEntry[] = [
  {
    prefix: ">",
    type: MarkdownNodeType.BLOCKQUOTE,
    depth: 0,
  },
  {
    prefix: "```",
    type: MarkdownNodeType.CODE_BLOCK,
    depth: 0,
  },
  {
    prefix: "---",
    type: MarkdownNodeType.HR,
    depth: 0,
  },
];

/**
 * List prefixes. Unlike the maps above, these only convert once the trailing
 * space is typed: the markdown for `"- "` is `"-"` (Turndown trims trailing
 * whitespace), so the cursor position tells `"- "` apart from a literal `"-"`.
 */
const LIST_PREFIX_MAP: HeadlineTypeEntry[] = [
  {
    prefix: "-",
    type: MarkdownNodeType.LIST,
    depth: 0,
  },
  {
    prefix: "*",
    type: MarkdownNodeType.LIST,
    depth: 0,
  },
  {
    prefix: "+",
    type: MarkdownNodeType.LIST,
    depth: 0,
  },
  {
    prefix: "1.",
    type: MarkdownNodeType.ORDERED_LIST,
    depth: 0,
  },
];

export interface BlockTypeDetection {
  type: MarkdownNodeType;
  matchedPrefix: string;
}

export function detectBlockTypeFromContent(content: string, cursorPosition: number): BlockTypeDetection | null {
  // Headings use the exact cursor heuristic so a paragraph only converts the
  // moment the trigger is typed (e.g. `# ` with cursor right after the space).
  for (const entry of HEADLINE_TYPE_MAP) {
    if (content.startsWith(entry.prefix)) {
      if (entry.prefix.length + 2 === cursorPosition) {
        return { type: entry.type, matchedPrefix: entry.prefix };
      }
      return null;
    }
  }

  // Non-heading block types convert as soon as their prefix appears at the start.
  const trimmed = content.trim();
  for (const entry of NON_HEADING_BLOCK_MAP) {
    if (trimmed.startsWith(entry.prefix)) {
      return { type: entry.type, matchedPrefix: entry.prefix };
    }
  }

  for (const entry of LIST_PREFIX_MAP) {
    if (trimmed === entry.prefix && entry.prefix.length + 2 === cursorPosition) {
      return { type: entry.type, matchedPrefix: entry.prefix };
    }
  }

  return null;
}

export function detectHeadlineTypeFromContent(content: string, cursorPosition: number): MarkdownNodeType | null {
  return detectBlockTypeFromContent(content, cursorPosition)?.type ?? null;
}
