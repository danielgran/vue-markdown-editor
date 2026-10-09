import StarterKit from "@tiptap/starter-kit";
import { useEditor } from "@tiptap/vue-3";
import { nextTick, type ModelRef } from "vue";
import type MarkdownModuleListState from "../Modules/MarkdownModuleListState";
import { ListBehavior } from "../TipTap/ListBehavior";
import { activeEditor } from "./activeEditorStore";
import {
  htmlToItems, itemsToHtml, type ListTag,
} from "./listItemsHtml";
import { useMarkdownModuleContext } from "./markdownModuleContext";
import useListEditorSync from "./useListEditorSync";

interface ListModuleOptions {
  modelValue: ModelRef<MarkdownModuleListState>;
  tag: ListTag;
}

/**
 * Shared setup for the bullet and ordered list modules, which only differ by the
 * list tag they render.
 */
export function useListModule({ modelValue, tag }: ListModuleOptions) {
  const toHtml = (items: Parameters<typeof itemsToHtml>[1]) => itemsToHtml(tag, items);
  const moduleContext = useMarkdownModuleContext();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        hardBreak: false,
        trailingNode: false,
      }),
      ListBehavior.configure({
        onExitList: (itemIndex) => nextTick(() => moduleContext.exitList(modelValue.value, itemIndex)),
        onCloseList: () => nextTick(() => moduleContext.closeList(modelValue.value)),
      }),
    ],
    content: toHtml(modelValue.value.items),
    onFocus: () => {
      activeEditor.value = editor.value ?? null;
    },
    onUpdate: ({ editor: instance }) => {
      modelValue.value.items = htmlToItems(instance.getHTML());
    },
  });

  useListEditorSync(editor, modelValue, toHtml);

  function focus() {
    editor.value?.commands.focus();
  }

  return { editor, focus };
}
