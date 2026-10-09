import type { Editor } from "@tiptap/core";
import {
  watch, type ModelRef, type ShallowRef,
} from "vue";
import type MarkdownModuleListState from "../Modules/MarkdownModuleListState";
import type MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import { htmlToItems } from "./listItemsHtml";

/**
 * Keeps a list editor in sync when its items change from the outside, such as
 * when two lists are merged after the paragraph between them is removed.
 *
 * TipTap only reads the content when the editor is created, so without this the
 * rendered list would keep showing stale items.
 */
export default function useListEditorSync(
  editor: ShallowRef<Editor | undefined>,
  modelValue: ModelRef<MarkdownModuleListState>,
  itemsToHtml: (items: MarkdownModuleTextState[]) => string,
) {
  /**
   * Compares the rendered text rather than the raw HTML: the serializer escapes
   * characters such as apostrophes to entities that TipTap writes back verbatim,
   * so an HTML comparison would rewrite the editor on every keystroke and reset
   * the selection.
   */
  function editorMatchesItems(editorInstance: Editor, items: MarkdownModuleTextState[]): boolean {
    const rendered = htmlToItems(editorInstance.getHTML());

    return rendered.length === items.length
      && rendered.every((item, index) => item.text === items[index]?.text);
  }

  watch(
    () => modelValue.value.items,
    (items) => {
      const editorInstance = editor.value;
      if (!editorInstance) return;
      if (editorMatchesItems(editorInstance, items)) return;

      editorInstance.commands.setContent(itemsToHtml(items), { emitUpdate: false });
    },
    { deep: true },
  );
}
