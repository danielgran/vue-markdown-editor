import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  afterEach, beforeEach, describe, expect, it, vi,
} from "vitest";
import { ListBehavior } from "../ListBehavior";

function press(editor: Editor, key: "Enter" | "Backspace") {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

function pressKey(editor: Editor, key: string) {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  );
}

function selectInsideItem(editor: Editor, text: string, offsetFromEnd: number) {
  let position = 1;

  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === text) position = pos + node.nodeSize - offsetFromEnd;
    return true;
  });

  editor.commands.setTextSelection(position);
  return position;
}

function selectEndOfItem(editor: Editor, text: string) {
  let position = 1;

  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === text) position = pos + node.nodeSize;
    return true;
  });

  editor.commands.setTextSelection(position);
  return position;
}

function selectFirstEmptyItem(editor: Editor) {
  let position = 1;

  editor.state.doc.descendants((node, pos) => {
    if (node.isTextblock && node.content.size === 0) position = pos + 1;
    return true;
  });

  editor.commands.setTextSelection(position);
  return position;
}

function selectStartOfItem(editor: Editor, text: string) {
  let position = 1;

  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === text) position = pos;
    return true;
  });

  editor.commands.setTextSelection(position);
  return position;
}

describe("ListBehavior", () => {
  let editor: Editor;
  let onExitList: ReturnType<typeof vi.fn>;
  let onCloseList: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onExitList = vi.fn();
    onCloseList = vi.fn();
    editor = new Editor({
      element: document.createElement("div"),
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
          hardBreak: false,
          trailingNode: false,
        }),
        ListBehavior.configure({ onExitList, onCloseList }),
      ],
      content: "<ul><li><p>one</p></li><li><p>two</p></li></ul>",
    });
  });

  afterEach(() => {
    editor.destroy();
  });

  describe("Enter", () => {
    it("splits a non-empty item into a new sibling bullet", () => {
      selectEndOfItem(editor, "one");
      press(editor, "Enter");

      expect(editor.getHTML()).toBe(
        "<ul><li><p>one</p></li><li><p></p></li><li><p>two</p></li></ul>",
      );
      expect(onExitList).not.toHaveBeenCalled();
    });

    it("asks the host to close the list when the item is empty", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p></p></li><li><p>two</p></li></ul>");
      selectFirstEmptyItem(editor);

      press(editor, "Enter");

      expect(onExitList).toHaveBeenCalledWith(1);
    });

    it("does not insert an item when the host closes the list", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p></p></li><li><p>two</p></li></ul>");
      selectFirstEmptyItem(editor);

      press(editor, "Enter");

      expect(editor.getHTML()).toBe(
        "<ul><li><p>one</p></li><li><p></p></li><li><p>two</p></li></ul>",
      );
    });

    it("closes the list through the empty item when Enter is pressed twice at the end", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
      selectEndOfItem(editor, "two");

      press(editor, "Enter");
      press(editor, "Enter");

      expect(onExitList).toHaveBeenCalledWith(2);
      expect(onCloseList).not.toHaveBeenCalled();
    });

    it("closes the list when the first Enter left text behind", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
      selectInsideItem(editor, "two", 1); // caret before the final "o"

      press(editor, "Enter");
      press(editor, "Enter");

      expect(onCloseList).toHaveBeenCalledTimes(1);
    });

    it("does not close the list once another key intervenes", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
      selectEndOfItem(editor, "two");

      press(editor, "Enter");
      pressKey(editor, "a");
      press(editor, "Enter");

      expect(onCloseList).not.toHaveBeenCalled();
    });

    it("does not close the list when the first Enter was not on the last item", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
      selectEndOfItem(editor, "one");

      press(editor, "Enter");
      press(editor, "Enter");

      expect(onCloseList).not.toHaveBeenCalled();
      expect(onExitList).toHaveBeenCalledWith(1);
    });

    it("reports the item index inside an ordered list", () => {
      editor.commands.setContent("<ol><li><p>one</p></li><li><p></p></li></ol>");
      selectFirstEmptyItem(editor);

      press(editor, "Enter");

      expect(onExitList).toHaveBeenCalledWith(1);
    });
  });

  describe("Backspace", () => {
    it("removes an empty item without splitting the list", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p></p></li><li><p>two</p></li></ul>");
      selectFirstEmptyItem(editor);

      press(editor, "Backspace");

      expect(editor.getHTML()).toBe("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
    });

    it("does not leave a trailing paragraph when the empty item is last", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p></p></li></ul>");
      selectFirstEmptyItem(editor);

      press(editor, "Backspace");

      expect(editor.getHTML()).toBe("<ul><li><p>one</p></li></ul>");
    });

    it("keeps the last remaining item in place", () => {
      editor.commands.setContent("<ul><li><p></p></li></ul>");
      editor.commands.setTextSelection(1);

      press(editor, "Backspace");

      expect(editor.getHTML()).toBe("<ul><li><p></p></li></ul>");
    });

    it("merges an item into the previous item instead of lifting it out", () => {
      editor.commands.setContent("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
      selectStartOfItem(editor, "two");

      press(editor, "Backspace");

      expect(editor.getHTML()).toBe("<ul><li><p>onetwo</p></li></ul>");
    });

    it("keeps the list together when backspacing at the start of the first item", () => {
      selectStartOfItem(editor, "one");

      press(editor, "Backspace");

      expect(editor.getHTML()).toBe("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
    });
  });
});
