import { getHTMLFromFragment, type Editor } from "@tiptap/core";
import type { EditorContent, EditorEvents } from "@tiptap/vue-3";
import { marked } from "marked";
import TurndownService from "turndown";
import {
  nextTick, ref, type ModelRef, type Ref,
} from "vue";
import type MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import { BlockKeys } from "../TipTap/BlockKeys";
import type { TextishEmitFunction } from "../Types/TextishEmits";
import { detectBlockTypeFromContent } from "./HeadlineTypeMap";
import { useMarkdownModuleContext } from "./markdownModuleContext";

const turndownService = new TurndownService();
// Override the default escape function to prevent escaping of special characters,
turndownService.escape = (text: string) => text;

// Headings and paragraphs are represented by MarkdownNodeType, not by the content text itself.
// Only inline markup (bold, italic, etc.) should be preserved as markdown syntax.
// Without this, TurndownService would convert <h2>text</h2> → "## text", which would be stored
// in componentState.text and cause the heading prefix to appear literally inside the TipTap editor
// on the next initialization (especially visible after HMR).
turndownService.addRule("blockElementsToInline", {
  filter: ["h1", "h2", "h3", "h4", "h5", "h6", "p"],
  replacement: (content: string) => content,
});

function markdownToHtml(markdown: string): string {
  return marked.parseInline(markdown) as string;
}

function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

/** Number of characters the given markdown renders as, e.g. for caret offsets. */
function renderedTextLength(markdown: string): number {
  const container = document.createElement("div");
  container.innerHTML = markdownToHtml(markdown);

  return container.textContent?.length ?? markdown.length;
}

export {
  markdownToHtml, htmlToMarkdown, renderedTextLength,
};

export default function useReflectiveState<T extends MarkdownModuleTextState>(options: {
  modelRef: ModelRef<T>;
  emit: TextishEmitFunction;
  editorRef?: Ref<InstanceType<typeof EditorContent> | undefined>;
  containingHtmlElementRef?: Ref<HTMLElement | undefined>;
}) {
  const editorContent = ref(markdownToHtml(options.modelRef.value.text));
  const moduleContext = useMarkdownModuleContext();

  async function handleTipTapUpdateEvent(event: EditorEvents["update"]) {
    emitHtml(event.editor.getHTML());
    emitCursorPosition(event.transaction.selection.anchor);

    // Wait for the DOM to update with the new content before trying to detect type changes
    await nextTick();
    const markdown = htmlToMarkdown(event.editor.getHTML());
    detectInlineTypeChange(markdown, event.transaction.selection.anchor);
  }

  /** The caret as ProseMirror position, preferring the selection the user sees. */
  function domCaretPosition(editor: Editor): number | null {
    const domSelection = window.getSelection();
    const dom = editor.view.dom;

    if (!domSelection?.anchorNode || !dom.contains(domSelection.anchorNode)) return null;

    return editor.view.posAtDOM(domSelection.anchorNode, domSelection.anchorOffset);
  }

  function caretPosition(editor: Editor): number {
    return domCaretPosition(editor) ?? editor.state.selection.anchor;
  }

  /** Whether the caret sits before the first character of the block. */
  function isCaretAtStart(editor: Editor): boolean {
    const domPosition = domCaretPosition(editor);
    if (domPosition !== null) return domPosition === 1 && window.getSelection()?.isCollapsed === true;

    const { selection } = editor.state;
    return selection.empty && selection.anchor === 1;
  }

  /**
   * The module content before and after the caret as markdown. Deriving both
   * halves from the document keeps inline markup intact, so splitting inside a
   * bold or italic run does not cut through its markers.
   *
   * A selection is left out of both halves, so pressing Enter on selected text
   * splits the block where that text was instead of keeping it.
   */
  function splitContentAtCaret(): { before: string; after: string } | null {
    const editor = options.editorRef?.value?.editor;
    if (!editor) return null;

    const { selection, doc } = editor.state;
    const from = selection.empty ? caretPosition(editor) : selection.from;
    const to = selection.empty ? from : selection.to;

    return {
      before: htmlToMarkdown(getHTMLFromFragment(doc.slice(0, from).content, editor.schema)),
      after: htmlToMarkdown(getHTMLFromFragment(doc.slice(to).content, editor.schema)),
    };
  }

  /** Hands Enter to the host, which decides how the block is split. */
  function handleEnter() {
    const halves = splitContentAtCaret();
    if (!halves) return;

    moduleContext.splitTextBlock(options.modelRef.value, halves.before, halves.after);
  }

  /**
   * Merges the block into the text block above when Backspace is pressed at the
   * start. Empty blocks never get here, they remove themselves instead.
   */
  function handleBackspaceAtStart(): boolean {
    const editor = options.editorRef?.value?.editor;
    if (!editor) return false;
    if (!isCaretAtStart(editor)) return false;

    return moduleContext.mergeTextBlockBackward(options.modelRef.value);
  }

  function handleBackspaceOnEmpty() {
    moduleContext.removeBlock(options.modelRef.value);
  }

  const blockKeys = BlockKeys({
    onEnter: handleEnter,
    onBackspaceAtStart: handleBackspaceAtStart,
    onBackspaceOnEmpty: handleBackspaceOnEmpty,
  });

  function detectInlineTypeChange(markdown: string, cursorPosition: number) {
    const detected = detectBlockTypeFromContent(markdown, cursorPosition);
    if (!detected) return;

    // Drop the trigger prefix so the converted block starts empty instead of
    // containing it (e.g. typing "- " creates an empty bullet, not one holding "-").
    options.modelRef.value.text = markdown.slice(detected.matchedPrefix.length).trimStart();
    options.emit("change-type", detected.type);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      return;
    }
  }
  function emitHtml(html: string) {
    const markdown = htmlToMarkdown(html);
    options.modelRef.value.text = markdown;
    options.emit("update:model-value", { text: markdown });
  }

  function emitCursorPosition(cursorPosition: number) {
    options.emit("update:cursor-position", cursorPosition);
  }

  /** Focuses the block, optionally placing the caret at a ProseMirror position. */
  function focus(cursorPosition?: number) {
    if (options.editorRef?.value?.editor) {
      options.editorRef.value.editor.commands.focus(cursorPosition);
      return;
    }
    options.containingHtmlElementRef?.value?.focus();
  }

  return {
    handleTipTapUpdateEvent,
    handleKeyDown,
    editorContent,
    blockKeys,
    expose: { focus },
  };
}
