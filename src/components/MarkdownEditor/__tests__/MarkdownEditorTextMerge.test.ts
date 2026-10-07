import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import {
  describe, expect, it,
} from "vitest";
import type { Editor } from "@tiptap/core";
import { useMarkdownEditor } from "../Composable/useMarkdownEditor";
import MarkdownEditor from "../MarkdownEditor.vue";
import MarkdownModuleHeadline1 from "../Modules/MarkdownModuleHeadline1.vue";
import MarkdownModuleParagraph from "../Modules/MarkdownModuleParagraph.vue";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType from "../Types/MarkdownAstNodeType";

/** The text modules expose their TipTap editor; unwrap it from the ref if needed. */
function tipTapEditor(instance: unknown): Editor {
  const exposed = (instance as { editor: Editor | { value: Editor } }).editor;
  return "commands" in exposed ? exposed : exposed.value;
}

function textOf(node: MarkdownAstNode): string {
  return (node.componentState as { text?: string }).text ?? "";
}

/** Node types and texts, ignoring markup-only blocks such as dividers. */
function shape(editor: ReturnType<typeof useMarkdownEditor>) {
  return editor.markdownNodes.value
    .filter(node => node.type !== MarkdownNodeType.HR)
    .map(node => [node.type, textOf(node)]);
}

function types(editor: ReturnType<typeof useMarkdownEditor>) {
  return editor.markdownNodes.value.map(node => node.type);
}

/** Places the caret so that `offset` characters sit before it. */
async function placeCaret(tip: Editor, offset: number) {
  tip.commands.setTextSelection(offset + 1);
  await nextTick();
}

async function pressBackspace(tip: Editor) {
  const event = new KeyboardEvent("keydown", {
    key: "Backspace", bubbles: true, cancelable: true,
  });
  tip.view.dom.dispatchEvent(event);
  await nextTick();
  await nextTick();
  await nextTick();
  return event;
}

describe("MarkdownEditor text merging on Backspace", () => {
  function mountEditor(content: string) {
    const editor = useMarkdownEditor(content);
    const wrapper = mount(MarkdownEditor, { props: { editor } });
    return { editor, wrapper };
  }

  it("appends the text to the paragraph above when Backspace is pressed on the first character", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello\n\nWorld");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[1]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressBackspace(tip);

    // Assert — one block left, holding both texts
    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, "HelloWorld"]]);
  });

  it("leaves the caret where the two blocks were joined", async () => {
    // Arrange
    const { wrapper } = mountEditor("Hello\n\nWorld");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[1]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressBackspace(tip);

    // Assert — the caret sits between "Hello" and "World"
    const merged = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    expect(merged.state.selection.anchor).toBe("Hello".length + 1);
  });

  it("keeps the block type of the block above", async () => {
    // Arrange — a paragraph merging into a headline keeps the headline
    const { editor, wrapper } = mountEditor("# Headline\n\nTail");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressBackspace(tip);

    // Assert
    expect(shape(editor)).toEqual([[MarkdownNodeType.HEADLINE1, "HeadlineTail"]]);
    expect(wrapper.findAllComponents(MarkdownModuleHeadline1)).toHaveLength(1);
  });

  it("keeps the markup of both halves balanced", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello **world**\n\nnext");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[1]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressBackspace(tip);

    // Assert
    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, "Hello **world**next"]]);
  });

  it("does not merge into a block that is not a text block", async () => {
    // Arrange — a divider sits above the paragraph
    const { editor, wrapper } = mountEditor("---\n\nWorld");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressBackspace(tip);

    // Assert — both blocks are still there
    expect(types(editor)).toEqual([MarkdownNodeType.HR, MarkdownNodeType.PARAGRAPH]);
    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, "World"]]);
  });

  it("does not merge the first block into anything", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressBackspace(tip);

    // Assert
    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, "Hello"]]);
  });

  it("still leaves Backspace alone when the caret is not at the start", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello\n\nWorld");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[1]!.vm);
    await placeCaret(tip, 2);

    // Act
    const event = await pressBackspace(tip);

    // Assert — the module does not take over, so the browser keeps deleting the
    // character before the caret (happy-dom does not perform that deletion itself)
    expect(event.defaultPrevented).toBe(false);
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, "Hello"],
      [MarkdownNodeType.PARAGRAPH, "World"],
    ]);
  });

  it("still removes an empty block instead of merging", async () => {
    // Arrange — a blank block below the paragraph
    const { editor, wrapper } = mountEditor("Hello");
    editor.addBlankNode(0);
    await nextTick();
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[1]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressBackspace(tip);

    // Assert
    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, "Hello"]]);
  });
});
