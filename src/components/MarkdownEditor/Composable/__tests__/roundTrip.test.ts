import { describe, expect, it } from "vitest";
import type MarkdownModuleImageState from "../../Modules/MarkdownModuleImageState";
import type { MarkdownAstNode } from "../../Types/MarkdownAstNode";
import MarkdownNodeType from "../../Types/MarkdownAstNodeType";
import { parseMarkdown } from "../parseMarkdown";
import { serializeMarkdown } from "../serializeMarkdown";

/**
 * Integration tests for the real remark-parse + remark-gfm pipeline (no mocks).
 *
 * remark-gfm auto-links bare URLs, which splits """...""" module blocks into
 * several paragraph children. These tests pin the parse → serialize round-trip
 * so an image/file whose src/url is auto-linked still becomes a module node.
 */

function singleNode(markdown: string): MarkdownAstNode {
  const nodes = parseMarkdown(markdown);
  expect(nodes).toHaveLength(1);
  return nodes[0]!;
}

describe("parseMarkdown + serializeMarkdown round-trip (real pipeline)", () => {
  it("parses an image block whose src URL is auto-linked by GFM into an IMAGE node", () => {
    // Arrange
    const markdown = '"""MarkdownModuleImage\nsrc: https://example.com/pic.png\nalt: A scenic view\ncaption: My caption\n"""';

    // Act
    const node = singleNode(markdown);
    const state = node.componentState as unknown as MarkdownModuleImageState;

    // Assert — auto-linking must not turn the block into a paragraph
    expect(node.type).toBe(MarkdownNodeType.IMAGE);
    expect(state.src).toBe("https://example.com/pic.png");
    expect(state.alt).toBe("A scenic view");
    expect(state.caption).toBe("My caption");
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("parses an image block with URLs in src, alt and caption into an IMAGE node", () => {
    // Arrange — every URL is auto-linked, splitting the block into many children
    const markdown = '"""MarkdownModuleImage\nsrc: https://example.com/banner.png\nalt: See https://example.com/alt for details\ncaption: Learn more at https://example.com/guide\n"""';

    // Act
    const node = singleNode(markdown);
    const state = node.componentState as unknown as MarkdownModuleImageState;

    // Assert
    expect(node.type).toBe(MarkdownNodeType.IMAGE);
    expect(state.src).toBe("https://example.com/banner.png");
    expect(state.alt).toBe("See https://example.com/alt for details");
    expect(state.caption).toBe("Learn more at https://example.com/guide");
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("parses a file block whose url is auto-linked by GFM into a FILE node", () => {
    // Arrange
    const markdown = '"""MarkdownModuleFile\nurl: https://example.com/files/report.pdf\nfileName: quarterly report.pdf\nfileSize: 24576\nmimeType: application/pdf\n"""';

    // Act
    const node = singleNode(markdown);

    // Assert
    expect(node.type).toBe(MarkdownNodeType.FILE);
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("round-trips a table", () => {
    // Arrange
    const markdown = "| Feature | Description |\n| --- | --- |\n| Tables | Editable grid blocks |\n| Code | Fenced code blocks |";

    // Act
    const node = singleNode(markdown);

    // Assert
    expect(node.type).toBe(MarkdownNodeType.TABLE);
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("round-trips a fenced code block with a language", () => {
    // Arrange
    const markdown = "```ts\nconst answer: number = 42;\n```";

    // Act
    const node = singleNode(markdown);

    // Assert
    expect(node.type).toBe(MarkdownNodeType.CODE_BLOCK);
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("round-trips a horizontal rule", () => {
    // Arrange
    const markdown = "Intro\n\n---\n\nOutro";

    // Act
    const nodes = parseMarkdown(markdown);

    // Assert
    expect(nodes.map(node => node.type)).toEqual([
      MarkdownNodeType.PARAGRAPH,
      MarkdownNodeType.HR,
      MarkdownNodeType.PARAGRAPH,
    ]);
    expect(serializeMarkdown(nodes)).toBe(markdown);
  });

  it("round-trips a blockquote that spans multiple lines", () => {
    // Arrange
    const markdown = "> This is a quote.\n> It spans two lines.";

    // Act
    const node = singleNode(markdown);

    // Assert
    expect(node.type).toBe(MarkdownNodeType.BLOCKQUOTE);
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("round-trips an ordered list", () => {
    // Arrange
    const markdown = "1. First item\n2. Second item";

    // Act
    const node = singleNode(markdown);

    // Assert
    expect(node.type).toBe(MarkdownNodeType.ORDERED_LIST);
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("round-trips an unordered list", () => {
    // Arrange
    const markdown = "- One\n- Two";

    // Act
    const node = singleNode(markdown);

    // Assert
    expect(node.type).toBe(MarkdownNodeType.LIST);
    expect(serializeMarkdown([node])).toBe(markdown);
  });

  it("parses a full showcase document into modules in order", () => {
    // Arrange — a document that mixes every module type
    const markdown = [
      "# Welcome",
      "",
      "Intro paragraph with **bold** and a [link](https://example.com).",
      "",
      "## Tables",
      "",
      "| Name | Role |",
      "| --- | --- |",
      "| Alice | Admin |",
      "",
      "## Quotes",
      "",
      "> Stay hungry, stay foolish.",
      "",
      "## Code",
      "",
      '```ts\nconst ok = true;\n```',
      "",
      "## Divider",
      "",
      "---",
      "",
      "## Lists",
      "",
      "- Unordered one",
      "- Unordered two",
      "",
      "1. Ordered one",
      "2. Ordered two",
      "",
      '"""MarkdownModuleImage\nsrc: https://example.com/photo.jpg\nalt: Photo\ncaption: Caption\n"""',
    ].join("\n");

    // Act
    const nodes = parseMarkdown(markdown);

    // Assert
    expect(nodes.map(node => node.type)).toEqual([
      MarkdownNodeType.HEADLINE1,
      MarkdownNodeType.PARAGRAPH,
      MarkdownNodeType.HEADLINE2,
      MarkdownNodeType.TABLE,
      MarkdownNodeType.HEADLINE2,
      MarkdownNodeType.BLOCKQUOTE,
      MarkdownNodeType.HEADLINE2,
      MarkdownNodeType.CODE_BLOCK,
      MarkdownNodeType.HEADLINE2,
      MarkdownNodeType.HR,
      MarkdownNodeType.HEADLINE2,
      MarkdownNodeType.LIST,
      MarkdownNodeType.ORDERED_LIST,
      MarkdownNodeType.IMAGE,
    ]);
    expect(serializeMarkdown(nodes)).toBe(markdown);
  });
});
