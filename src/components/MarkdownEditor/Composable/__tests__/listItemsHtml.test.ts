import {
  describe, expect, it,
} from "vitest";
import MarkdownModuleTextState from "../../Modules/MarkdownModuleTextState";
import { htmlToItems, itemsToHtml } from "../listItemsHtml";

function items(...texts: string[]) {
  return texts.map(text => new MarkdownModuleTextState({ text }));
}

describe("itemsToHtml", () => {
  it("keeps an empty bullet list editable", () => {
    expect(itemsToHtml("ul", [])).toBe("<ul><li><p></p></li></ul>");
  });

  it("keeps an empty ordered list editable", () => {
    expect(itemsToHtml("ol", [])).toBe("<ol><li><p></p></li></ol>");
  });

  it("renders bullet list items", () => {
    expect(itemsToHtml("ul", items("a", "b"))).toBe(
      "<ul><li><p>a</p></li><li><p>b</p></li></ul>",
    );
  });

  it("renders ordered list items with the ordered tag", () => {
    expect(itemsToHtml("ol", items("a"))).toBe("<ol><li><p>a</p></li></ol>");
  });

  it("renders inline markdown as HTML", () => {
    expect(itemsToHtml("ul", items("**bold**"))).toBe(
      "<ul><li><p><strong>bold</strong></p></li></ul>",
    );
  });
});

describe("htmlToItems", () => {
  it("reads list items back into states", () => {
    expect(htmlToItems("<ul><li><p>a</p></li><li><p>b</p></li></ul>").map(item => item.text)).toEqual(["a", "b"]);
  });

  it("falls back to a single empty item when there are no list items", () => {
    expect(htmlToItems("<p>not a list</p>").map(item => item.text)).toEqual([""]);
  });

  it("round-trips text through HTML", () => {
    const original = items("first", "second");

    const roundTripped = htmlToItems(itemsToHtml("ul", original));

    expect(roundTripped.map(item => item.text)).toEqual(["first", "second"]);
  });
});
