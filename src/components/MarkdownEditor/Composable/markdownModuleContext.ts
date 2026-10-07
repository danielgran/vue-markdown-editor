import {
  inject, provide, type InjectionKey,
} from "vue";

/**
 * Editor actions a module can invoke on its own block, so a module can change
 * editor state without routing an event through every parent component.
 */
export interface MarkdownModuleContext {
  /**
   * Closes the list that owns `state` at `itemIndex`, replacing it with the items
   * before, an empty paragraph and the items after, then focuses that paragraph.
   */
  exitList: (state: object, itemIndex: number) => void;
  /** Appends an empty block after the list that owns `state` and focuses it. */
  closeList: (state: object) => void;
  /**
   * Splits the text block that owns `state` at the caret, using the module content
   * before and after it. An empty `after` continues in a new block below, an empty
   * `before` opens one above and keeps the caret where it is.
   */
  splitTextBlock: (state: object, before: string, after: string) => void;
  /**
   * Merges the text block that owns `state` into the text block above it, which
   * keeps its type and takes over the text. Returns whether it merged.
   */
  mergeTextBlockBackward: (state: object) => boolean;
}

const markdownModuleContextKey: InjectionKey<MarkdownModuleContext> = Symbol("markdownModuleContext");

/** Used by modules rendered outside the editor, where there is nothing to control. */
const inertMarkdownModuleContext: MarkdownModuleContext = {
  exitList: () => {},
  closeList: () => {},
  splitTextBlock: () => {},
  mergeTextBlockBackward: () => false,
};

export function provideMarkdownModuleContext(context: MarkdownModuleContext) {
  provide(markdownModuleContextKey, context);
}

export function useMarkdownModuleContext(): MarkdownModuleContext {
  return inject(markdownModuleContextKey, inertMarkdownModuleContext);
}
