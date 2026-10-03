enum MarkdownNodeType {
  PARAGRAPH,
  HEADLINE1,
  HEADLINE2,
  HEADLINE3,
  IMAGE,
  LIST,
  FILE,
  BLOCKQUOTE,
  CODE_BLOCK,
  HR,
  TABLE,
  ORDERED_LIST,
}

export type TextishNodeType
  = | MarkdownNodeType.PARAGRAPH
    | MarkdownNodeType.LIST
    | MarkdownNodeType.HEADLINE1
    | MarkdownNodeType.HEADLINE2
    | MarkdownNodeType.HEADLINE3
    | MarkdownNodeType.BLOCKQUOTE
    | MarkdownNodeType.ORDERED_LIST;

export function isTextNodeType(type: MarkdownNodeType): type is TextishNodeType {
  return (
    type === MarkdownNodeType.PARAGRAPH
    || type === MarkdownNodeType.LIST
    || type === MarkdownNodeType.HEADLINE1
    || type === MarkdownNodeType.HEADLINE2
    || type === MarkdownNodeType.HEADLINE3
    || type === MarkdownNodeType.BLOCKQUOTE
    || type === MarkdownNodeType.ORDERED_LIST
  );
}

export default MarkdownNodeType;

