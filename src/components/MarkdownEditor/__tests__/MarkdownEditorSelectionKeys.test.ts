import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import {
  describe, expect, it,
} from "vitest";
import type { Editor } from "@tiptap/core";
import { useMarkdownEditor } from "../Composable/useMarkdownEditor";
import MarkdownEditor from "../MarkdownEditor.vue";
import MarkdownModuleParagraph from "../Modules/MarkdownModuleParagraph.vue";
import MarkdownNodeType from "../Types/MarkdownAstNodeType";

/** The text modules expose their TipTap editor; unwrap it from the ref if needed. */
function tipTapEditor(instance: unknown): Editor {
  const exposed = (instance as { editor: Editor | { value: Editor } }).editor;
  return "commands" in exposed ? exposed : exposed.value;
}

/** Node types and texts, which is all these cases change. */
function shape(editor: ReturnType<typeof useMarkdownEditor>) {
  return editor.markdownNodes.value.map(node => [
    node.type,
    (node.componentState as { text?: string }).text ?? "",
  ]);
}

function focusedIndex(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll(".markdown-editor-module")
    .findIndex(module => module.classes().includes("is-focused"));
}

async function selectAll(tip: Editor) {
  tip.commands.selectAll();
  await nextTick();
}

async function pressKey(tip: Editor, key: string) {
  tip.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", {
      key, bubbles: true, cancelable: true,
    }),
  );
  await nextTick();
  await nextTick();
  await nextTick();
}

describe("MarkdownEditor keys with a selected text", () => {
  function mountEditor(content: string) {
    const editor = useMarkdownEditor(content);
    const wrapper = mount(MarkdownEditor, { props: { editor } });
    return { editor, wrapper };
  }

  it("replaces the selection with the split when Enter is pressed", async () => {
    // Arrange — "Hello World" with "ell" selected
    const { editor, wrapper } = mountEditor("Hello World");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    tip.commands.setTextSelection({ from: 2, to: 5 });
    await nextTick();

    // Act
    await pressKey(tip, "Enter");

    // Assert — the selected text is gone, the halves sit on either side of the split
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, "H"],
      [MarkdownNodeType.PARAGRAPH, "o World"],
    ]);
  });

  it("empties the block and continues below when Enter is pressed on the whole text", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await selectAll(tip);

    // Act
    await pressKey(tip, "Enter");

    // Assert — the text is dropped and a fresh block waits below the emptied one
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, ""],
      [MarkdownNodeType.PARAGRAPH, ""],
    ]);
    expect(focusedIndex(wrapper)).toBe(1);
  });

  it("keeps the block when Backspace clears the whole selection", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await selectAll(tip);

    // Act
    await pressKey(tip, "Backspace");

    // Assert — clearing the text leaves an empty block instead of removing it
    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, ""]]);
  });
});
