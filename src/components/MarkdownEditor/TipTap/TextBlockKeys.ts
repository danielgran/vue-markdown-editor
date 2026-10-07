import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

export interface TextBlockKeysOptions {
  /** Enter was pressed inside the block. */
  onEnter: () => void;
  /**
   * Backspace was pressed with the caret before the first character. Returns
   * whether the module handled it, so everything else keeps deleting backwards.
   */
  onBackspaceAtStart: () => boolean;
}

/**
 * Gives a text module control over the keys that act on block boundaries: the
 * block stays single-line, Enter is handed to the module, and Backspace at the
 * start can merge the block into the one above. Stopping propagation keeps the
 * block wrapper's key handler from adding another block on top of it.
 */
export function TextBlockKeys(options: TextBlockKeysOptions) {
  return Extension.create({
    name: "textBlockKeys",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          props: {
            handleKeyDown: (_, event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                options.onEnter();
                return true;
              }

              if (event.key === "Backspace" && options.onBackspaceAtStart()) {
                event.preventDefault();
                event.stopPropagation();
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
