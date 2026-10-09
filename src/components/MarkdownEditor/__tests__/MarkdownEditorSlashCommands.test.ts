import {
  enableAutoUnmount, mount,
} from "@vue/test-utils";
import { nextTick } from "vue";
import {
  afterEach, describe, expect, it, vi,
} from "vitest";
import type { Editor } from "@tiptap/core";
import { useMarkdownEditor } from "../Composable/useMarkdownEditor";
import useSlashMenu from "../Composable/useSlashMenu";
import MarkdownEditor from "../MarkdownEditor.vue";
import MarkdownModuleHeadline1 from "../Modules/MarkdownModuleHeadline1.vue";
import MarkdownModuleParagraph from "../Modules/MarkdownModuleParagraph.vue";
import {
  defaultSlashCommands, filterSlashCommands,
} from "../SlashMenu/slashCommands";
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

function slashMenuElement(): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(".markdown-editor-slash-menu");
}

// The menu is teleported to the document body, so mounted editors must be
// unmounted between tests to keep their menus out of the next test's DOM.
enableAutoUnmount(afterEach);

/** Opens the menu by leaving a `/query` behind in the focused block. */
async function typeSlashQuery(editor: ReturnType<typeof useMarkdownEditor>, query: string) {
  (editor.markdownNodes.value[0].componentState as { text: string }).text = `/${query}`;
  await nextTick();
  await nextTick();
}

function pressKey(wrapper: ReturnType<typeof mount>, key: string) {
  wrapper.element.dispatchEvent(
    new KeyboardEvent("keydown", {
      key, bubbles: true, cancelable: true,
    }),
  );
}

describe("filterSlashCommands", () => {
  it("returns every command for an empty query", () => {
    expect(filterSlashCommands(defaultSlashCommands, "")).toEqual(defaultSlashCommands);
  });

  it("matches on the title, keywords and id, case-insensitively", () => {
    expect(filterSlashCommands(defaultSlashCommands, "H1").map(command => command.id)).toEqual(["heading1"]);
    expect(filterSlashCommands(defaultSlashCommands, "quote").map(command => command.id)).toEqual(["blockquote"]);
    expect(filterSlashCommands(defaultSlashCommands, "  table ").map(command => command.id)).toEqual(["table"]);
  });

  it("returns nothing when no command matches", () => {
    expect(filterSlashCommands(defaultSlashCommands, "zzz")).toEqual([]);
  });
});

describe("useSlashMenu", () => {
  function makeMenu() {
    const onSelect = vi.fn();
    const menu = useSlashMenu({ commands: () => defaultSlashCommands, onSelect });
    return { menu, onSelect };
  }

  function keydown(key: string): KeyboardEvent {
    return new KeyboardEvent("keydown", { key });
  }

  it("starts closed and opens with the filtered items", () => {
    const { menu } = makeMenu();

    expect(menu.isVisible.value).toBe(false);

    menu.open("h1", { x: 10, y: 20 });

    expect(menu.isVisible.value).toBe(true);
    expect(menu.anchorX.value).toBe(10);
    expect(menu.anchorY.value).toBe(20);
    expect(menu.items.value.map(command => command.id)).toEqual(["heading1"]);
  });

  it("wraps the highlight around the item list", () => {
    const { menu } = makeMenu();
    menu.open("", { x: 0, y: 0 });

    menu.moveActive(-1);
    expect(menu.activeIndex.value).toBe(defaultSlashCommands.length - 1);

    menu.moveActive(1);
    expect(menu.activeIndex.value).toBe(0);
  });

  it("keeps the highlight when the same query is reopened", () => {
    const { menu } = makeMenu();
    menu.open("", { x: 0, y: 0 });
    menu.moveActive(2);

    menu.open("", { x: 5, y: 5 });

    expect(menu.activeIndex.value).toBe(2);
  });

  it("ignores keys while closed", () => {
    const { menu, onSelect } = makeMenu();

    expect(menu.handleKeydown(keydown("Enter"))).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selects the highlighted command on Enter and closes", () => {
    const { menu, onSelect } = makeMenu();
    menu.open("h1", { x: 0, y: 0 });

    expect(menu.handleKeydown(keydown("Enter"))).toBe(true);

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "heading1" }));
    expect(menu.isVisible.value).toBe(false);
  });

  it("closes on Escape without selecting", () => {
    const { menu, onSelect } = makeMenu();
    menu.open("", { x: 0, y: 0 });

    expect(menu.handleKeydown(keydown("Escape"))).toBe(true);

    expect(onSelect).not.toHaveBeenCalled();
    expect(menu.isVisible.value).toBe(false);
  });

  it("drops Enter without selecting when nothing matches", () => {
    const { menu, onSelect } = makeMenu();
    menu.open("zzz", { x: 0, y: 0 });

    expect(menu.items.value).toEqual([]);
    expect(menu.handleKeydown(keydown("Enter"))).toBe(true);

    expect(onSelect).not.toHaveBeenCalled();
    expect(menu.isVisible.value).toBe(false);
  });

  it("leaves unrelated keys to the editor", () => {
    const { menu } = makeMenu();
    menu.open("", { x: 0, y: 0 });

    expect(menu.handleKeydown(keydown("a"))).toBe(false);
    expect(menu.isVisible.value).toBe(true);
  });
});

describe("MarkdownEditor slash commands", () => {
  function mountEditor(props: Record<string, unknown> = {}, content = "Hello") {
    const editor = useMarkdownEditor(content);
    const wrapper = mount(MarkdownEditor, {
      props: { editor, focusedNode: editor.markdownNodes.value[0], ...props },
    });
    return { editor, wrapper };
  }

  it("opens the menu when the focused block starts with a slash", async () => {
    const { editor } = mountEditor();

    await typeSlashQuery(editor, "");

    expect(slashMenuElement()).not.toBeNull();
    expect(slashMenuElement()!.querySelectorAll(".slash-menu-item")).toHaveLength(defaultSlashCommands.length);
    expect(slashMenuElement()!.textContent).toContain("Heading 1");
  });

  it("filters the menu by the typed query", async () => {
    const { editor } = mountEditor();

    await typeSlashQuery(editor, "code");

    const items = slashMenuElement()!.querySelectorAll(".slash-menu-item");
    expect(items).toHaveLength(1);
    expect(items[0]!.textContent).toContain("Code block");
  });

  it("shows an empty state when no command matches", async () => {
    const { editor } = mountEditor();
    await typeSlashQuery(editor, "zzz");

    expect(slashMenuElement()).not.toBeNull();
    expect(slashMenuElement()!.querySelectorAll(".slash-menu-item")).toHaveLength(0);
    expect(slashMenuElement()!.textContent).toContain("No matching blocks");
  });

  it("converts the block on Enter and drops the slash query", async () => {
    const { editor, wrapper } = mountEditor();
    await typeSlashQuery(editor, "h1");

    pressKey(wrapper, "Enter");
    await nextTick();
    await nextTick();

    expect(shape(editor)).toEqual([[MarkdownNodeType.HEADLINE1, ""]]);
    expect(wrapper.findAllComponents(MarkdownModuleHeadline1)).toHaveLength(1);
    expect(slashMenuElement()).toBeNull();
  });

  it("selects the command highlighted with the arrow keys", async () => {
    const { editor, wrapper } = mountEditor();
    await typeSlashQuery(editor, "");

    pressKey(wrapper, "ArrowDown");
    await nextTick();
    pressKey(wrapper, "Enter");
    await nextTick();
    await nextTick();

    // The second entry of the default list is Heading 1.
    expect(shape(editor)).toEqual([[MarkdownNodeType.HEADLINE1, ""]]);
  });

  it("converts the block when a menu entry is clicked", async () => {
    const { editor } = mountEditor();
    await typeSlashQuery(editor, "");

    const items = slashMenuElement()!.querySelectorAll<HTMLElement>(".slash-menu-item");
    items[1]!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    await nextTick();
    await nextTick();

    expect(shape(editor)).toEqual([[MarkdownNodeType.HEADLINE1, ""]]);
  });

  it("closes the menu on Escape and keeps the block untouched", async () => {
    const { editor, wrapper } = mountEditor();
    await typeSlashQuery(editor, "h1");

    pressKey(wrapper, "Escape");
    await nextTick();

    expect(slashMenuElement()).toBeNull();
    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, "/h1"]]);
  });

  it("closes the menu on an outside mouse-down", async () => {
    const { editor } = mountEditor();
    await typeSlashQuery(editor, "");

    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await nextTick();

    expect(slashMenuElement()).toBeNull();
  });

  it("keeps the menu open when the click stays inside the editor", async () => {
    const { editor, wrapper } = mountEditor();
    await typeSlashQuery(editor, "");

    wrapper.element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await nextTick();

    expect(slashMenuElement()).not.toBeNull();
  });

  it("does not open for a block that is not a text block", async () => {
    const { editor } = mountEditor({}, "- item");
    await nextTick();

    expect(editor.markdownNodes.value[0]!.type).toBe(MarkdownNodeType.LIST);
    expect(slashMenuElement()).toBeNull();
  });

  it("stays disabled when enableSlashCommands is false", async () => {
    const { editor } = mountEditor({ enableSlashCommands: false });

    await typeSlashQuery(editor, "");

    expect(slashMenuElement()).toBeNull();
  });

  it("supports custom command lists", async () => {
    const { editor, wrapper } = mountEditor({
      slashCommands: [{
        id: "quote-only",
        title: "Only quote",
        type: MarkdownNodeType.BLOCKQUOTE,
      }],
    });
    await typeSlashQuery(editor, "");

    expect(slashMenuElement()!.querySelectorAll(".slash-menu-item")).toHaveLength(1);

    pressKey(wrapper, "Enter");
    await nextTick();
    await nextTick();

    expect(shape(editor)).toEqual([[MarkdownNodeType.BLOCKQUOTE, ""]]);
  });

  it("converts an empty paragraph into itself when the Text command is picked", async () => {
    const { editor, wrapper } = mountEditor();
    await typeSlashQuery(editor, "text");

    pressKey(wrapper, "Enter");
    await nextTick();
    await nextTick();

    expect(shape(editor)).toEqual([[MarkdownNodeType.PARAGRAPH, ""]]);
    expect(wrapper.findAllComponents(MarkdownModuleParagraph)).toHaveLength(1);
    expect(tipTapEditor(wrapper.findAllComponents(MarkdownModuleParagraph)[0]!.vm).getText()).toBe("");
  });
});
