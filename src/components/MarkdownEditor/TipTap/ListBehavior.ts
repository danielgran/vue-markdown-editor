import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export interface ListBehaviorOptions {
  /**
   * Called when Enter is pressed on an empty list item, with that item's index.
   * The host decides what closing the list means for the surrounding blocks.
   */
  onExitList: (itemIndex: number) => void;
  /**
   * Called when Enter is pressed twice in a row at the end of the list. The host
   * appends an empty block after the list, so the list ends where the user was.
   */
  onCloseList: () => void;
}

/**
 * List keymap tweaks for the block-based editor.
 *
 * TipTap's native list keymap calls `liftListItem` for Enter on an empty item
 * and for Backspace at the start of an item. Lifting pulls the item out of the
 * list and splits it in two around a paragraph, which a single list block
 * cannot represent without losing content.
 *
 * - Enter on an empty item closes the list through `onExitList`.
 * - Enter twice in a row at the end of the list closes it through `onCloseList`,
 *   even when the first Enter left text behind (pressing Enter mid-text splits
 *   the item, so the caret does not sit on an empty item).
 * - Backspace removes an empty item, or merges an item into the previous one.
 *
 * Everything else keeps the native behaviour.
 */
export const ListBehavior = Extension.create<ListBehaviorOptions>({
  name: "listBehavior",
  priority: 1000,
  addOptions() {
    return { onExitList: () => {}, onCloseList: () => {} };
  },
  addStorage() {
    return { pendingClose: false };
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from } = this.editor.state.selection;
        const listItem = $from.node(-1);

        if (!listItem || listItem.type.name !== "listItem") return false;
        if ($from.parent.type.name !== "paragraph") return false;
        if (listItem.childCount !== 1) return false;

        const isLastItem = $from.index(-2) === $from.node(-2).childCount - 1;

        if ($from.parent.content.size === 0) {
          this.storage.pendingClose = false;
          this.options.onExitList($from.index(-2));
          return true;
        }

        if (this.storage.pendingClose && isLastItem) {
          this.storage.pendingClose = false;
          this.options.onCloseList();
          return true;
        }

        // The native keymap splits this item; remember that it happened at the
        // end so the next Enter can close the list instead of adding a bullet.
        this.storage.pendingClose = isLastItem;
        return false;
      },
      Backspace: () => {
        const { $from, empty } = this.editor.state.selection;
        const listItem = $from.node(-1);

        if (!empty) return false;
        if (!listItem || listItem.type.name !== "listItem") return false;
        if ($from.parent.type.name !== "paragraph") return false;
        if (listItem.childCount !== 1) return false;

        if ($from.parent.content.size === 0) {
          // A list must keep at least one item, so leave the last one in place.
          if ($from.node(-2).childCount === 1) return true;

          return this.editor
            .chain()
            .deleteRange({ from: $from.before(-1), to: $from.after(-1) })
            .run();
        }

        // At the start of an item the native keymap lifts it out of the list,
        // so merge it into the previous item instead.
        if ($from.parentOffset === 0) {
          this.editor.commands.joinTextblockBackward();
          return true;
        }

        return false;
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          // Anything other than Enter means the user is editing, not closing.
          handleKeyDown: (_view, event) => {
            if (event.key !== "Enter") this.storage.pendingClose = false;
            return false;
          },
        },
      }),
    ];
  },
});
