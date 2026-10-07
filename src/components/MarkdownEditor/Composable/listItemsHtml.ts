import MarkdownModuleTextState from "../Modules/MarkdownModuleTextState";
import { htmlToMarkdown, markdownToHtml } from "./useReflectiveState";

export type ListTag = "ul" | "ol";

/**
 * Serializes list items into the HTML the list editors understand, always
 * keeping at least one item so the list stays editable.
 */
export function itemsToHtml(tag: ListTag, items: MarkdownModuleTextState[]): string {
  if (items.length === 0) return `<${tag}><li><p></p></li></${tag}>`;

  const listItems = items.map(item => `<li><p>${markdownToHtml(item.text)}</p></li>`).join("");
  return `<${tag}>${listItems}</${tag}>`;
}

/** Parses HTML produced by {@link itemsToHtml} back into list item states. */
export function htmlToItems(html: string): MarkdownModuleTextState[] {
  const div = document.createElement("div");
  div.innerHTML = html;

  const listItems = Array.from(div.querySelectorAll("li"));
  if (listItems.length === 0) return [new MarkdownModuleTextState({ text: "" })];

  return listItems.map(li => new MarkdownModuleTextState({ text: htmlToMarkdown(li.innerHTML) }));
}
