import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export interface BlockKeysOptions {
  /**
   * Enter was pressed inside the block. Omit it for a block that holds its own
   * newlines, such as a code block.
   */
  onEnter?: () => void;
  /**
   * Backspace was pressed with the caret before the first character. Returns
   * whether the module handled it, so everything else keeps deleting backwards.
   */
  onBackspaceAtStart?: () => boolean;
  /** Backspace was pressed in a block without content, which removes the block. */
  onBackspaceOnEmpty: () => void;
}

/**
 * Gives a single-content block control over the keys that act on its boundaries:
 * Backspace removes an empty block and can merge a block into the one above, and
 * Enter is handed to the module when it wants to split.
 *
 * Answering Backspace here matters because this runs before the editor touches the
 * content: it tells a block that was already empty apart from one that this very
 * key press emptied, which has to keep the block alive. Stopping propagation keeps
 * the block wrapper's key handler from reacting on top of it.
 */
export function BlockKeys(options: BlockKeysOptions) {
  return Extension.create({
    name: "blockKeys",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleKeyDown: (view, event) => {
              if (event.key === "Backspace") {
                if (view.state.doc.textContent === "") {
                  event.preventDefault();
                  event.stopPropagation();
                  options.onBackspaceOnEmpty();

                  return true;
                }

                if (options.onBackspaceAtStart?.()) {
                  event.preventDefault();
                  event.stopPropagation();

                  return true;
                }

                return false;
              }

              if (event.key === "Enter" && options.onEnter) {
                event.preventDefault();
                event.stopPropagation();
                options.onEnter();

                return true;
              }

              return false;
            },
          },
        }),
      ];
    },
  });
}
