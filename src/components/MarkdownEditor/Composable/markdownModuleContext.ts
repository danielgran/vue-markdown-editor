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
}

const markdownModuleContextKey: InjectionKey<MarkdownModuleContext> = Symbol("markdownModuleContext");

/** Used by modules rendered outside the editor, where there is nothing to control. */
const inertMarkdownModuleContext: MarkdownModuleContext = {
  exitList: () => {},
  closeList: () => {},
};

export function provideMarkdownModuleContext(context: MarkdownModuleContext) {
  provide(markdownModuleContextKey, context);
}

export function useMarkdownModuleContext(): MarkdownModuleContext {
  return inject(markdownModuleContextKey, inertMarkdownModuleContext);
}
