import { mount } from "@vue/test-utils";
import {
  defineComponent, nextTick, ref,
} from "vue";
import {
  beforeEach, describe, expect, it, vi,
} from "vitest";
import type { Editor } from "@tiptap/core";
import { provideMarkdownModuleContext } from "../Composable/markdownModuleContext";
import MarkdownModuleListState from "../Modules/MarkdownModuleListState";
import MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import MarkdownModuleList from "../Modules/MarkdownModuleList.vue";
import type { MarkdownAstNode } from "../Types/MarkdownAstNode";
import MarkdownNodeType from "../Types/MarkdownAstNodeType";
import { useMarkdownEditor } from "../Composable/useMarkdownEditor";
import MarkdownEditor from "../MarkdownEditor.vue";

function listItems(node: MarkdownAstNode): string[] {
  return (node.componentState as MarkdownModuleListState).items.map(item => item.text);
}

function types(nodeList: MarkdownAstNode[]): MarkdownNodeType[] {
  return nodeList.map(node => node.type);
}

/** The list modules expose their TipTap editor; unwrap it from the ref if needed. */
function exposedEditor(instance: unknown): Editor {
  const exposed = (instance as { editor: Editor | { value: Editor } }).editor;
  return "commands" in exposed ? exposed : exposed.value;
}

async function pressEnterOnEmptyItem(editor: Editor) {
  let position = 1;
  editor.state.doc.descendants((node, pos) => {
    if (node.isTextblock && node.content.size === 0) position = pos + 1;
    return true;
  });
  editor.commands.setTextSelection(position);

  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );

  await nextTick();
  await nextTick();
  await nextTick();
}

async function pressEnter(editor: Editor) {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
  );
  await nextTick();
  await nextTick();
  await nextTick();
}

/** Places the caret `offsetFromEnd` characters before the end of `itemText`. */
function selectInsideItem(editor: Editor, itemText: string, offsetFromEnd: number) {
  let position = 1;
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === itemText) position = pos + node.nodeSize - offsetFromEnd;
    return true;
  });
  editor.commands.setTextSelection(position);
  return position;
}

describe("MarkdownEditor list splitting", () => {
  function mountEditor(content: string) {
    const editor = useMarkdownEditor(content);
    const wrapper = mount(MarkdownEditor, { props: { editor } });
    return { editor, wrapper };
  }

  it("splits the list when Enter is pressed twice from the end of the last item", async () => {
    // Arrange — caret on the last character, like clicking the end of the list
    const { editor, wrapper } = mountEditor("- a\n- click the block's menu");
    const tip = exposedEditor(wrapper.findAllComponents(MarkdownModuleList)[0]!.vm);
    selectInsideItem(tip, "click the block's menu", 0);

    // Act
    await pressEnter(tip);
    await pressEnter(tip);

    // Assert
    expect(types(editor.markdownNodes.value)).toEqual([
      MarkdownNodeType.LIST,
      MarkdownNodeType.PARAGRAPH,
    ]);
  });

  it("splits the list when the second Enter follows a split at the list end", async () => {
    // Arrange — caret one character before the end, so the first Enter leaves a tail
    const { editor, wrapper } = mountEditor("- a\n- click the block's menu");
    const tip = exposedEditor(wrapper.findAllComponents(MarkdownModuleList)[0]!.vm);
    selectInsideItem(tip, "click the block's menu", 1);

    // Act
    await pressEnter(tip);
    await pressEnter(tip);

    // Assert — the tail stays in the list, and the list ends there
    expect(types(editor.markdownNodes.value)).toEqual([
      MarkdownNodeType.LIST,
      MarkdownNodeType.PARAGRAPH,
    ]);
    expect(listItems(editor.markdownNodes.value[0]!)).toEqual(["a", "click the block's men", "u"]);
  });

  it("splits a list into two lists around an empty paragraph when Enter is pressed on an empty item", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("- a\n- x\n- c");
    (editor.markdownNodes.value[0]!.componentState as MarkdownModuleListState).items[1]!.text = "";
    await nextTick();

    // Act
    await pressEnterOnEmptyItem(exposedEditor(wrapper.findAllComponents(MarkdownModuleList)[0]!.vm));

    // Assert
    expect(types(editor.markdownNodes.value)).toEqual([
      MarkdownNodeType.LIST,
      MarkdownNodeType.PARAGRAPH,
      MarkdownNodeType.LIST,
    ]);
    expect(listItems(editor.markdownNodes.value[0]!)).toEqual(["a"]);
    expect(listItems(editor.markdownNodes.value[2]!)).toEqual(["c"]);
  });

  it("closes the list with a trailing paragraph when the last item is emptied", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("- a\n- b");
    (editor.markdownNodes.value[0]!.componentState as MarkdownModuleListState).items[1]!.text = "";
    await nextTick();

    // Act
    await pressEnterOnEmptyItem(exposedEditor(wrapper.findAllComponents(MarkdownModuleList)[0]!.vm));

    // Assert
    expect(types(editor.markdownNodes.value)).toEqual([
      MarkdownNodeType.LIST,
      MarkdownNodeType.PARAGRAPH,
    ]);
    expect(listItems(editor.markdownNodes.value[0]!)).toEqual(["a"]);
  });

  it("merges the two lists again when the empty paragraph between them is removed", async () => {
    // Arrange
    const { editor, wrapper } = mountEditor("- a\n- x\n- c");
    (editor.markdownNodes.value[0]!.componentState as MarkdownModuleListState).items[1]!.text = "";
    await nextTick();
    await pressEnterOnEmptyItem(exposedEditor(wrapper.findAllComponents(MarkdownModuleList)[0]!.vm));
    expect(editor.markdownNodes.value).toHaveLength(3);

    // Act
    editor.deleteNode(1);
    await nextTick();
    await nextTick();
    await nextTick();

    // Assert
    expect(editor.markdownNodes.value).toHaveLength(1);
    expect(editor.markdownNodes.value[0]?.type).toBe(MarkdownNodeType.LIST);
    expect(listItems(editor.markdownNodes.value[0]!)).toEqual(["a", "c"]);

    // The merged list must also be rendered — the editor does not re-read its
    // content on its own, so it has to be synced from the model.
    const rendered = wrapper.findAll(".markdown-editor-module .tiptap li p").map(node => node.text());
    expect(rendered).toEqual(["a", "c"]);
  });
});

describe("MarkdownModuleList editor access", () => {
  let exitList: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    exitList = vi.fn();
  });

  it("asks the editor context to close the list, without emitting an event", async () => {
    // Arrange — host provides the editor context, exactly like MarkdownEditor does
    const state = ref(new MarkdownModuleListState({
      items: [
        new MarkdownModuleTextState({ text: "a" }),
        new MarkdownModuleTextState({ text: "" }),
      ],
    }));

    const Host = defineComponent({
      components: { MarkdownModuleList },
      setup() {
        provideMarkdownModuleContext({ exitList });
        return { state };
      },
      template: "<MarkdownModuleList :model-value=\"state\" />",
    });

    const wrapper = mount(Host);

    // Act
    await pressEnterOnEmptyItem(exposedEditor(wrapper.findComponent(MarkdownModuleList).vm));

    // Assert
    expect(exitList).toHaveBeenCalledTimes(1);
    const [calledState, calledIndex] = exitList.mock.calls[0]!;
    expect(calledState).toBe((state.value as MarkdownModuleListState));
    expect(calledIndex).toBe(1);
    expect(wrapper.findComponent(MarkdownModuleList).emitted()).not.toHaveProperty("exit-list");
  });
});
