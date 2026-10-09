import { mount } from "@vue/test-utils";
import {
  defineComponent, nextTick, ref, shallowRef,
} from "vue";
import {
  describe, expect, it, vi,
} from "vitest";
import type { Editor } from "@tiptap/core";
import MarkdownModuleListState from "../../Modules/MarkdownModuleListState";
import MarkdownModuleTextState from "../../Modules/MarkdownModuleTextState";
import { itemsToHtml } from "../listItemsHtml";
import useListEditorSync from "../useListEditorSync";

function makeState(...texts: string[]) {
  return ref(new MarkdownModuleListState({
    items: texts.map(text => new MarkdownModuleTextState({ text })),
  }));
}

/** Mounts the composable against a stub editor whose HTML is fixed. */
function mountSync(editorHtml: string) {
  const setContent = vi.fn();
  const editor = shallowRef({
    getHTML: () => editorHtml,
    commands: { setContent },
  } as unknown as Editor);

  const modelValue = makeState();

  mount(defineComponent({
    setup() {
      useListEditorSync(editor, modelValue, items => itemsToHtml("ul", items));
      return () => null;
    },
  }));

  return { modelValue, setContent };
}

describe("useListEditorSync", () => {
  it("leaves the editor alone when only HTML escaping differs", async () => {
    // Arrange — TipTap serializes the apostrophe literally, while marked escapes
    // it to &#39; when the model HTML is built. Both describe the same list, so
    // rewriting the editor here would reset the selection on every keystroke.
    const { modelValue, setContent } = mountSync(
      "<ul><li><p>click the block's context menu trigger</p></li></ul>",
    );

    // Act
    modelValue.value.items = [new MarkdownModuleTextState({ text: "click the block's context menu trigger" })];
    await nextTick();

    // Assert
    expect(setContent).not.toHaveBeenCalled();
  });

  it("does not rewrite the editor when the model already matches what is rendered", async () => {
    // Arrange
    const { modelValue, setContent } = mountSync("<ul><li><p>one</p></li><li><p>two</p></li></ul>");

    // Act
    modelValue.value.items = [
      new MarkdownModuleTextState({ text: "one" }),
      new MarkdownModuleTextState({ text: "two" }),
    ];
    await nextTick();

    // Assert
    expect(setContent).not.toHaveBeenCalled();
  });

  it("rewrites the editor when the model gained items the editor does not show", async () => {
    // Arrange — this is what happens when two lists are merged
    const { modelValue, setContent } = mountSync("<ul><li><p>one</p></li></ul>");

    // Act
    modelValue.value.items = [
      new MarkdownModuleTextState({ text: "one" }),
      new MarkdownModuleTextState({ text: "two" }),
    ];
    await nextTick();

    // Assert
    expect(setContent).toHaveBeenCalledTimes(1);
    expect(setContent.mock.calls[0]![0]).toBe("<ul><li><p>one</p></li><li><p>two</p></li></ul>");
    expect(setContent.mock.calls[0]![1]).toEqual({ emitUpdate: false });
  });

  it("rewrites the editor when an item text changed", async () => {
    // Arrange
    const { modelValue, setContent } = mountSync("<ul><li><p>one</p></li></ul>");

    // Act
    modelValue.value.items = [new MarkdownModuleTextState({ text: "one changed" })];
    await nextTick();

    // Assert
    expect(setContent).toHaveBeenCalledTimes(1);
  });
});
