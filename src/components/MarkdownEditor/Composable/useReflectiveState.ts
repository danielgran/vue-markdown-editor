import type { EditorContent, EditorEvents } from "@tiptap/vue-3";
import { marked } from "marked";
import TurndownService from "turndown";
import { nextTick, ref, type ModelRef, type Ref } from "vue";
import type MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import type { TextishEmitFunction } from "../Types/TextishEmits";
import { detectHeadlineTypeFromContent } from "./HeadlineTypeMap";

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
  replacement: (content) => content,
});

function markdownToHtml(markdown: string): string {
  return marked.parseInline(markdown) as string;
}

function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

function useReflectiveState<T extends MarkdownModuleTextState>(options: {
  modelRef: ModelRef<T>;
  emit: TextishEmitFunction;
  editorRef?: Ref<InstanceType<typeof EditorContent> | undefined>;
  containingHtmlElementRef?: Ref<HTMLElement | undefined>;
}) {
  const editorContent = ref(markdownToHtml(options.modelRef.value.text));

  async function handleTipTapUpdateEvent(event: EditorEvents["update"]) {
    emitHtml(event.editor.getHTML());
    emitCursorPosition(event.transaction.selection.anchor);

    // Wait for the DOM to update with the new content before trying to detect type changes
    await nextTick();
    const markdown = htmlToMarkdown(event.editor.getHTML());
    detectInlineTypeChange(markdown, event.transaction.selection.anchor);
  }

  function detectInlineTypeChange(markdown: string, cursorPosition: number) {
    const detectedType = detectHeadlineTypeFromContent(markdown, cursorPosition);
    if (!detectedType) return;

    options.emit("change-type", detectedType);
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

  function focus() {
    if (options.editorRef?.value?.editor) {
      options.editorRef.value.editor.commands.focus();
      return;
    }
    options.containingHtmlElementRef?.value?.focus();
  }

  return { handleTipTapUpdateEvent, handleKeyDown, editorContent, expose: { focus } };
}

export { markdownToHtml };
export default useReflectiveState;
