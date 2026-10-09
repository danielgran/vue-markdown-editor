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
  return (node.componentState as { text: string }).text;
}

function shape(editor: ReturnType<typeof useMarkdownEditor>) {
  return editor.markdownNodes.value.map(node => [node.type, textOf(node)]);
}

/** Places the caret so that `offset` characters sit before it. */
async function placeCaret(tip: Editor, offset: number) {
  tip.commands.setTextSelection(offset + 1);
  await nextTick();
}

async function pressEnter(tip: Editor) {
  tip.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Enter", bubbles: true, cancelable: true,
    }),
  );
  await nextTick();
  await nextTick();
  await nextTick();
}

describe("MarkdownEditor text splitting", () => {
  function mountEditor(content: string) {
    const editor = useMarkdownEditor(content);
    const wrapper = mount(MarkdownEditor, { props: { editor } });
    return { editor, wrapper };
  }

  it("splits a paragraph at the caret and moves the rest into a new module below", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello World");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, "Hello".length);

    // Act
    await pressEnter(tip);

    // Assert — first half stays on top, second half continues in the new module
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, "Hello"],
      [MarkdownNodeType.PARAGRAPH, "World"],
    ]);

    // Assert — the top module renders the truncated text, not the stale content
    expect(
      tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm).getText(),
    ).toBe("Hello");
  });

  it("splits a paragraph inside bold text without breaking its markup", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello **world**");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, "Hello wo".length);

    // Act
    await pressEnter(tip);

    // Assert — both halves keep balanced markdown instead of cutting through "**"
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, "Hello **wo**"],
      [MarkdownNodeType.PARAGRAPH, "**rld**"],
    ]);
  });

  it("keeps the focus in the new module after splitting", async () => {
    // Arrange
    const { wrapper } = mountEditor("Hello World");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, "Hello".length);

    // Act
    await pressEnter(tip);

    // Assert
    const modules = wrapper.findAll(".markdown-editor-module");
    expect(modules[0]!.classes()).not.toContain("is-focused");
    expect(modules[1]!.classes()).toContain("is-focused");
  });

  it("inserts an empty module above when Enter is pressed on the first character", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressEnter(tip);

    // Assert — the text stays put, the new module sits on top of it
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, ""],
      [MarkdownNodeType.PARAGRAPH, "Hello"],
    ]);

    // Assert — the caret stays in the text module, so typing continues where it was
    const modules = wrapper.findAll(".markdown-editor-module");
    expect(modules[0]!.classes()).not.toContain("is-focused");
    expect(modules[1]!.classes()).toContain("is-focused");
    expect(tip.state.selection.anchor).toBe(1);
  });

  it("adds an empty paragraph below when Enter is pressed at the end of the text", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, "Hello".length);

    // Act
    await pressEnter(tip);

    // Assert
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, "Hello"],
      [MarkdownNodeType.PARAGRAPH, ""],
    ]);
  });

  it("splits a headline and continues in a paragraph", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("# Hello World");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleHeadline1)[0]!.vm);
    await placeCaret(tip, "Hello".length);

    // Act
    await pressEnter(tip);

    // Assert — the headline keeps the text before the caret, the rest is plain text
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.HEADLINE1, "Hello"],
      [MarkdownNodeType.PARAGRAPH, "World"],
    ]);
    expect(wrapper.findAllComponents(MarkdownModuleParagraph)).toHaveLength(1);
  });

  it("inserts an empty paragraph above a headline when Enter is pressed on the first character", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("# Hello");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleHeadline1)[0]!.vm);
    await placeCaret(tip, 0);

    // Act
    await pressEnter(tip);

    // Assert
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, ""],
      [MarkdownNodeType.HEADLINE1, "Hello"],
    ]);
  });

  it("continues below when Enter is pressed on an empty text module", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("Hello");
    const tip = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm);
    await placeCaret(tip, "Hello".length);

    // Act — the caret now sits on an empty module
    await pressEnter(tip);
    const emptyModule = tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[1]!.vm);
    await pressEnter(emptyModule);

    // Assert — an empty module keeps adding below, never above
    expect(shape(editor)).toEqual([
      [MarkdownNodeType.PARAGRAPH, "Hello"],
      [MarkdownNodeType.PARAGRAPH, ""],
      [MarkdownNodeType.PARAGRAPH, ""],
    ]);
  });
});
