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

export function detectHeadlineTypeFromContent(content: string, cursorPosition: number): MarkdownNodeType | null {
  const matchedEntry = HEADLINE_TYPE_MAP.find(entry => content.startsWith(entry.prefix));
  if (!matchedEntry) return null;

  if (matchedEntry.prefix.length + 2 === cursorPosition) {
    return matchedEntry.type;
  }

  return null;
}
