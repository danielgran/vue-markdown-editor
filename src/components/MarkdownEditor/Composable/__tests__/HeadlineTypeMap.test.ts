import { describe, expect, it } from "vitest";
import MarkdownNodeType from "../../Types/MarkdownAstNodeType";
import { detectHeadlineTypeFromContent, HEADLINE_TYPE_MAP } from "../HeadlineTypeMap";

describe("HEADLINE_TYPE_MAP", () => {
  it("contains entries for h1, h2, and h3", () => {
    // Arrange
    const expectedTypes = [MarkdownNodeType.HEADLINE1, MarkdownNodeType.HEADLINE2, MarkdownNodeType.HEADLINE3];

    // Act
    const actualTypes = HEADLINE_TYPE_MAP.map((e) => e.type);

    // Assert
    expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
  });

  it("maps correct prefixes to each headline depth", () => {
    // Arrange / Act
    const h1 = HEADLINE_TYPE_MAP.find((e) => e.type === MarkdownNodeType.HEADLINE1);
    const h2 = HEADLINE_TYPE_MAP.find((e) => e.type === MarkdownNodeType.HEADLINE2);
    const h3 = HEADLINE_TYPE_MAP.find((e) => e.type === MarkdownNodeType.HEADLINE3);

    // Assert
    expect(h1?.prefix).toBe("#");
    expect(h2?.prefix).toBe("##");
    expect(h3?.prefix).toBe("###");
  });
});

describe("detectHeadlineTypeFromContent", () => {
  it("returns HEADLINE1 when content starts with '#' and cursor is at position 3", () => {
    // Arrange
    const content = "# ";
    const cursorPosition = 3; // prefix.length + 2 = 1 + 2 = 3

    // Act
    const result = detectHeadlineTypeFromContent(content, cursorPosition);

    // Assert
    expect(result).toBe(MarkdownNodeType.HEADLINE1);
  });

  it("returns HEADLINE2 when content starts with '##' and cursor is at position 4", () => {
    // Arrange
    const content = "## ";
    const cursorPosition = 4; // prefix.length + 2 = 2 + 2 = 4

    // Act
    const result = detectHeadlineTypeFromContent(content, cursorPosition);

    // Assert
    expect(result).toBe(MarkdownNodeType.HEADLINE2);
  });

  it("returns HEADLINE3 when content starts with '###' and cursor is at position 5", () => {
    // Arrange
    const content = "### ";
    const cursorPosition = 5; // prefix.length + 2 = 3 + 2 = 5

    // Act
    const result = detectHeadlineTypeFromContent(content, cursorPosition);

    // Assert
    expect(result).toBe(MarkdownNodeType.HEADLINE3);
  });

  it("returns null when content matches a prefix but cursor is not at the trigger position", () => {
    // Arrange
    const content = "# Some heading already typed";
    const cursorPosition = 10;

    // Act
    const result = detectHeadlineTypeFromContent(content, cursorPosition);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null for plain text content that does not start with a headline prefix", () => {
    // Arrange
    const content = "This is a paragraph";
    const cursorPosition = 3;

    // Act
    const result = detectHeadlineTypeFromContent(content, cursorPosition);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null for empty content", () => {
    // Arrange
    const content = "";
    const cursorPosition = 0;

    // Act
    const result = detectHeadlineTypeFromContent(content, cursorPosition);

    // Assert
    expect(result).toBeNull();
  });

  it("prefers longer prefix match (### before ## before #)", () => {
    // Arrange — '###' starts with both '##' and '#', but HEADLINE3 should win
    const content = "### ";
    const cursorPosition = 5;

    // Act
    const result = detectHeadlineTypeFromContent(content, cursorPosition);

    // Assert
    expect(result).toBe(MarkdownNodeType.HEADLINE3);
  });
});
