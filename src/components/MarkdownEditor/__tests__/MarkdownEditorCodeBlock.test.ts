import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import {
  describe, expect, it,
} from "vitest";
import type { Editor } from "@tiptap/core";
import { useMarkdownEditor } from "../Composable/useMarkdownEditor";
import MarkdownEditor from "../MarkdownEditor.vue";
import MarkdownModuleCodeBlock from "../Modules/MarkdownModuleCodeBlock.vue";
import MarkdownNodeType from "../Types/MarkdownAstNodeType";

/** The code block module exposes its TipTap editor; unwrap it from the ref if needed. */
function tipTapEditor(instance: unknown): Editor {
  const exposed = (instance as { editor: Editor | { value: Editor } }).editor;
  return "commands" in exposed ? exposed : exposed.value;
}

function codeOf(editor: ReturnType<typeof useMarkdownEditor>): string {
  return (editor.markdownNodes.value[0]!.componentState as { code: string }).code;
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

describe("MarkdownEditor code block", () => {
  function mountEditor(content: string) {
    const editor = useMarkdownEditor(content);
    const wrapper = mount(MarkdownEditor, { props: { editor } });
    return { editor, wrapper };
  }

  function codeEditor(wrapper: ReturnType<typeof mount>): Editor {
    return tipTapEditor(wrapper.findAllComponents(MarkdownModuleCodeBlock)[0]!.vm);
  }

  it("stays a code block when its whole content is deleted", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("```ts\nconst x = 1;\n```");
    const tip = codeEditor(wrapper);
    expect(tip.getText()).toBe("const x = 1;");
    tip.commands.selectAll();
    await nextTick();

    // Act
    await pressKey(tip, "Backspace");

    // Assert — the emptied block is still one code block, not a paragraph
    expect(editor.markdownNodes.value.map(node => node.type)).toEqual([MarkdownNodeType.CODE_BLOCK]);
    expect(codeOf(editor)).toBe("");
    expect(tip.state.doc.firstChild!.type.name).toBe("codeBlock");
  });

  it("removes the block when Backspace is pressed in an empty code block", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("```\n\n```");
    expect(editor.markdownNodes.value).toHaveLength(1);

    // Act
    await pressKey(codeEditor(wrapper), "Backspace");

    // Assert
    expect(editor.markdownNodes.value).toHaveLength(0);
  });

  it("adds a line to the code instead of leaving the block on Enter", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("```\nconst x = 1;\n```");
    const tip = codeEditor(wrapper);
    tip.commands.setTextSelection(tip.state.doc.content.size - 1);
    await nextTick();

    // Act
    await pressKey(tip, "Enter");

    // Assert — the newline stays inside the block
    expect(editor.markdownNodes.value).toHaveLength(1);
    expect(tip.state.doc.firstChild!.type.name).toBe("codeBlock");
    expect(codeOf(editor)).toBe("const x = 1;\n");
  });
});
