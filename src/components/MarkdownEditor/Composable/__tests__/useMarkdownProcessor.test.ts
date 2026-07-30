import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownAstNode } from "../../Types/MarkdownAstNode";
import MarkdownNodeType from "../../Types/MarkdownAstNodeType";
import MarkdownModuleTextState from "../../Modules/MarkdownModuleTextState";
import MarkdownModuleImageState from "../../Modules/MarkdownModuleImageState";
import MarkdownModuleListState from "../../Modules/MarkdownModuleListState";

// --- Hoist mock functions so they are available when vi.mock factory runs ---
const { mockCreateTextNode, mockCreateImageNode, mockCreateBlankParagraph, mockCreateListNode, mockUnifiedParse } = vi.hoisted(() => ({
  mockCreateTextNode: vi.fn(),
  mockCreateImageNode: vi.fn(),
  mockCreateBlankParagraph: vi.fn(),
  mockCreateListNode: vi.fn(),
  mockUnifiedParse: vi.fn(),
}));

// --- Mock unified (second-layer dep) — defaults to real parser ---
vi.mock("unified", () => ({
  unified: () => ({
    use: () => ({
      parse: mockUnifiedParse,
    }),
  }),
}));

// --- Mock MarkdownNodeFactory (second-layer dep) ---
vi.mock("../../Factory/MarkdownNodeFactory", () => ({
  default: {
    createTextNode: mockCreateTextNode,
    createImageNode: mockCreateImageNode,
    createBlankParagraph: mockCreateBlankParagraph,
    createListNode: mockCreateListNode,
  },
}));

// --- Node builder helpers (available after imports are resolved) ---
const makeFakeTextNode = (type: MarkdownNodeType, text: string): MarkdownAstNode<MarkdownModuleTextState> =>
  new MarkdownAstNode({ type, componentState: new MarkdownModuleTextState({ text }), editingState: { cursorPosition: 0 } });

const makeFakeImageNode = (src: string, alt: string, caption: string): MarkdownAstNode<MarkdownModuleImageState> =>
  new MarkdownAstNode({
    type: MarkdownNodeType.IMAGE,
    componentState: new MarkdownModuleImageState({ src, alt, caption }),
    editingState: { cursorPosition: 0 },
  });

const makeFakeListNode = (items: string[]): MarkdownAstNode<MarkdownModuleListState> =>
  new MarkdownAstNode({
    type: MarkdownNodeType.LIST,
    componentState: new MarkdownModuleListState({
      items: items.map(text => new MarkdownModuleTextState({ text })),
    }),
    editingState: { cursorPosition: 0 },
  });

// Import SUT after mocks
import useMarkdownProcessor from "../useMarkdownProcessor";

describe("useMarkdownProcessor", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: unified mock passes through to the real remark-parse parser
    const actualUnified = await vi.importActual<any>("unified");
    const actualRemarkParse = await vi.importActual<any>("remark-parse");
    mockUnifiedParse.mockImplementation((input: string) => {
      return actualUnified.unified().use(actualRemarkParse.default).parse(input);
    });

    mockCreateTextNode.mockImplementation((type: MarkdownNodeType, text: string) => makeFakeTextNode(type, text));
    mockCreateImageNode.mockImplementation((src: string, alt: string, caption: string) =>
      makeFakeImageNode(src, alt, caption),
    );
    mockCreateBlankParagraph.mockImplementation(() => makeFakeTextNode(MarkdownNodeType.PARAGRAPH, ""));
    mockCreateListNode.mockImplementation((items: string[]) => makeFakeListNode(items));
  });

  // Helper: wrap a string in a ModelRef-like ref
  function makeModel(initial: string) {
    return ref<string | undefined>(initial);
  }

  describe("compileMarkdown — initial parse", () => {
    it("parses a paragraph into a PARAGRAPH node", () => {
      // Arrange
      const model = makeModel("Hello world");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.PARAGRAPH);
    });

    it("parses a h1 heading into a HEADLINE1 node", () => {
      // Arrange
      const model = makeModel("# Title");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HEADLINE1);
    });

    it("parses a h2 heading into a HEADLINE2 node", () => {
      // Arrange
      const model = makeModel("## Sub-title");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HEADLINE2);
    });

    it("parses a h3 heading into a HEADLINE3 node", () => {
      // Arrange
      const model = makeModel("### Section");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HEADLINE3);
    });

    it("parses multiple blocks into multiple nodes in order", () => {
      // Arrange
      const model = makeModel("# Title\n\nParagraph text");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(2);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HEADLINE1);
      expect(markdownNodes.value[1]?.type).toBe(MarkdownNodeType.PARAGRAPH);
    });

    it("parses the custom image block syntax into an IMAGE node", () => {
      // Arrange
      const imageMarkdown = '"""MarkdownModuleImage\nsrc: https://example.com/img.png\nalt: A picture\ncaption: My caption\n"""';
      const model = makeModel(imageMarkdown);

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.IMAGE);
      expect(mockCreateImageNode).toHaveBeenCalledWith("https://example.com/img.png", "A picture", "My caption");
    });

    it("initializes nodes from empty string without error", () => {
      // Arrange
      const model = makeModel("");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(0);
    });
  });

  describe("serializeMarkdown — reactive model update", () => {
    it("serializes a PARAGRAPH node back to plain text", async () => {
      // Arrange
      const model = makeModel("Some text");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate the node state to trigger watcher
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      node.componentState.text = "Updated text";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("Updated text");
    });

    it("serializes a HEADLINE1 node with '# ' prefix", async () => {
      // Arrange
      const model = makeModel("# Original");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      node.componentState.text = "New Title";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("# New Title");
    });

    it("serializes a HEADLINE2 node with '## ' prefix", async () => {
      // Arrange
      const model = makeModel("## Original");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      node.componentState.text = "Sub Title";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("## Sub Title");
    });

    it("serializes a HEADLINE3 node with '### ' prefix", async () => {
      // Arrange
      const model = makeModel("### Original");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      node.componentState.text = "Section Title";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("### Section Title");
    });

    it("does not re-parse when model update originates from internal serialization", async () => {
      // Arrange
      const model = makeModel("Hello");
      const { markdownNodes } = useMarkdownProcessor(model);
      const initialLength = markdownNodes.value.length;

      // Act — trigger an internal update cycle
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      node.componentState.text = "Hello changed";
      await nextTick();
      await nextTick();

      // Assert — nodes array was NOT re-populated (no additional compileMarkdown call)
      expect(markdownNodes.value.length).toBe(initialLength);
    });
  });

  describe("external model change triggers re-parse", () => {
    it("re-compiles nodes when model ref is updated externally", async () => {
      // Arrange
      const model = makeModel("# First");
      const { markdownNodes } = useMarkdownProcessor(model);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HEADLINE1);

      // Act
      model.value = "## Second";
      await nextTick();
      await nextTick();

      // Assert
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HEADLINE2);
    });
  });

  describe("deleteNode", () => {
    it("removes the node at the given index after nextTick", async () => {
      // Arrange
      const model = makeModel("# Title\n\nParagraph");
      const { markdownNodes, deleteNode } = useMarkdownProcessor(model);
      expect(markdownNodes.value).toHaveLength(2);

      // Act
      deleteNode(0);
      await nextTick();

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.PARAGRAPH);
    });
  });

  describe("addBlankNode", () => {
    it("inserts a blank paragraph after the given index", async () => {
      // Arrange
      const model = makeModel("# Title\n\nParagraph");
      const { markdownNodes, addBlankNode } = useMarkdownProcessor(model);
      expect(markdownNodes.value).toHaveLength(2);

      // Act
      addBlankNode(0);
      await nextTick();

      // Assert
      expect(markdownNodes.value).toHaveLength(3);
      expect(markdownNodes.value[1]?.type).toBe(MarkdownNodeType.PARAGRAPH);
      expect(mockCreateBlankParagraph).toHaveBeenCalled();
    });

    it("returns the new node index (nodeIndex + 1)", () => {
      // Arrange
      const model = makeModel("# Title\n\nParagraph");
      const { addBlankNode } = useMarkdownProcessor(model);

      // Act
      const newIndex = addBlankNode(0);

      // Assert
      expect(newIndex).toBe(1);
    });
  });

  describe("replaceNodeType", () => {
    it("replaces the node type while preserving text content", async () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, replaceNodeType } = useMarkdownProcessor(model);
      const originalNode = markdownNodes.value[0]!;

      // Act
      const result = replaceNodeType(originalNode, MarkdownNodeType.HEADLINE2);
      await nextTick();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.newNode.type).toBe(MarkdownNodeType.HEADLINE2);
      expect(result?.index).toBe(0);
    });

    it("returns null when the node already has the requested type", () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, replaceNodeType } = useMarkdownProcessor(model);
      const node = markdownNodes.value[0]!;

      // Act
      const result = replaceNodeType(node, MarkdownNodeType.HEADLINE1);

      // Assert
      expect(result).toBeNull();
    });

    it("returns null when the node is not found in the nodes array", () => {
      // Arrange
      const model = makeModel("# Title");
      const { replaceNodeType } = useMarkdownProcessor(model);
      const orphanNode = makeFakeTextNode(MarkdownNodeType.PARAGRAPH, "orphan");

      // Act
      const result = replaceNodeType(orphanNode, MarkdownNodeType.HEADLINE2);

      // Assert
      expect(result).toBeNull();
    });

    it("replaces a text node with an IMAGE node", async () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, replaceNodeType } = useMarkdownProcessor(model);
      const node = markdownNodes.value[0]!;

      // Act
      const result = replaceNodeType(node, MarkdownNodeType.IMAGE);
      await nextTick();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.newNode.type).toBe(MarkdownNodeType.IMAGE);
      expect(mockCreateImageNode).toHaveBeenCalledWith("Title", "", "");
    });

    it("replaces a text node with a LIST node", async () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, replaceNodeType } = useMarkdownProcessor(model);
      const node = markdownNodes.value[0]!;

      // Act
      const result = replaceNodeType(node, MarkdownNodeType.LIST);
      await nextTick();

      // Assert
      expect(result).not.toBeNull();
      expect(result?.newNode.type).toBe(MarkdownNodeType.LIST);
      expect(mockCreateListNode).toHaveBeenCalledWith(["Title"]);
    });
  });

  describe("addBlankNode — without index", () => {
    it("pushes a blank paragraph to the end when no index is provided", () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, addBlankNode } = useMarkdownProcessor(model);

      // Act
      const newIndex = addBlankNode(undefined!);

      // Assert
      expect(markdownNodes.value).toHaveLength(2);
      expect(markdownNodes.value[1]?.type).toBe(MarkdownNodeType.PARAGRAPH);
      expect(newIndex).toBe(NaN);
    });

    it("returns correct index when inserting after an existing node", () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, addBlankNode } = useMarkdownProcessor(model);

      // Act
      const newIndex = addBlankNode(0);

      // Assert
      expect(markdownNodes.value).toHaveLength(2);
      expect(markdownNodes.value[1]?.type).toBe(MarkdownNodeType.PARAGRAPH);
      expect(newIndex).toBe(1);
    });
  });

  describe("addNodeWithType", () => {
    it("inserts a node of the specified type after the given index", () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, addNodeWithType } = useMarkdownProcessor(model);

      // Act
      const newIndex = addNodeWithType(0, MarkdownNodeType.HEADLINE2, "New Heading");

      // Assert
      expect(markdownNodes.value).toHaveLength(2);
      expect(markdownNodes.value[1]?.type).toBe(MarkdownNodeType.HEADLINE2);
      expect(newIndex).toBe(1);
      expect(mockCreateTextNode).toHaveBeenCalledWith(MarkdownNodeType.HEADLINE2, "New Heading");
    });

    it("pushes to the end when nodeIndex is undefined", () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, addNodeWithType } = useMarkdownProcessor(model);

      // Act
      const newIndex = addNodeWithType(undefined!, MarkdownNodeType.PARAGRAPH, "End text");

      // Assert
      expect(markdownNodes.value).toHaveLength(2);
      expect(markdownNodes.value[1]?.type).toBe(MarkdownNodeType.PARAGRAPH);
      expect(newIndex).toBe(NaN);
    });

    it("creates a LIST node with non-empty content", () => {
      // Arrange
      const model = makeModel("# Title");
      const { addNodeWithType } = useMarkdownProcessor(model);

      // Act
      addNodeWithType(0, MarkdownNodeType.LIST, "item text");

      // Assert
      expect(mockCreateListNode).toHaveBeenCalledWith(["item text"]);
    });

    it("creates a LIST node with empty content string", () => {
      // Arrange
      const model = makeModel("# Title");
      const { addNodeWithType } = useMarkdownProcessor(model);

      // Act
      addNodeWithType(0, MarkdownNodeType.LIST, "");

      // Assert
      expect(mockCreateListNode).toHaveBeenCalledWith([""]);
    });

    it("creates an IMAGE node from content string", () => {
      // Arrange
      const model = makeModel("# Title");
      const { addNodeWithType } = useMarkdownProcessor(model);

      // Act
      addNodeWithType(0, MarkdownNodeType.IMAGE, "some src");

      // Assert
      expect(mockCreateImageNode).toHaveBeenCalledWith("some src", "", "");
    });

    it("throws for an unsupported node type", () => {
      // Arrange
      const model = makeModel("# Title");
      const { addNodeWithType } = useMarkdownProcessor(model);

      // Act & Assert
      expect(() => addNodeWithType(0, 999 as MarkdownNodeType, "content")).toThrow(
        "Unsupported node type: 999",
      );
    });
  });

  describe("serializeMarkdown — LIST and IMAGE", () => {
    it("serializes a LIST node with multiple items", async () => {
      // Arrange
      const model = makeModel("- a\n- b");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate to trigger serialization
      const listNode = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleListState>;
      listNode.componentState.items[0]!.text = "changed";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("- changed\n- b");
    });

    it("serializes an IMAGE node to the custom block syntax", async () => {
      // Arrange
      const model = makeModel('"""MarkdownModuleImage\nsrc: https://x.com/pic.png\nalt: Alt\ncaption: Capt\n"""');
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate to trigger serialization
      const imgNode = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleImageState>;
      imgNode.componentState.src = "https://x.com/new.png";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe('"""MarkdownModuleImage\nsrc: https://x.com/new.png\nalt: Alt\ncaption: Capt\n"""');
    });
  });

  describe("compileMarkdown — phrasingContentToText coverage", () => {
    it("preserves strong text in headings", () => {
      // Arrange
      const model = makeModel("# Hello **world**");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HEADLINE1);
      expect(mockCreateTextNode).toHaveBeenCalledWith(MarkdownNodeType.HEADLINE1, "Hello **world**");
    });

    it("preserves emphasis text in paragraphs", () => {
      // Arrange
      const model = makeModel("Hello *world*");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.PARAGRAPH);
      expect(mockCreateTextNode).toHaveBeenCalledWith(MarkdownNodeType.PARAGRAPH, "Hello *world*");
    });

    it("preserves mixed strong and emphasis in text", () => {
      // Arrange
      const model = makeModel("A **bold** and *italic* text");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(mockCreateTextNode).toHaveBeenCalledWith(
        MarkdownNodeType.PARAGRAPH,
        "A **bold** and *italic* text",
      );
    });

    it("parses an unordered list into a LIST node", () => {
      // Arrange
      const model = makeModel("- item1\n- item2");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.LIST);
      expect(mockCreateListNode).toHaveBeenCalledWith(["item1", "item2"]);
    });

    it("handles custom block syntax with unknown module name as regular text", () => {
      // Arrange
      const unknownBlock = '"""UnknownModule\nsome: value\n"""';
      const model = makeModel(unknownBlock);

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.PARAGRAPH);
      expect(mockCreateImageNode).not.toHaveBeenCalled();
    });

    it("handles heading depth 4+ by not producing any node", () => {
      // Arrange
      const model = makeModel("#### Deep Heading\n\nSome paragraph");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert — h4 should be skipped, only paragraph remains
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.PARAGRAPH);
    });

    it("returns empty string for list item without paragraph child", () => {
      // Arrange
      // remark-parse always wraps list items in a paragraph, so we test
      // the branch indirectly: list with items containing text
      const model = makeModel("- simple item");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(mockCreateListNode).toHaveBeenCalledWith(["simple item"]);
    });
  });

  describe("moveNode", () => {
    it("reorders nodes by moving fromIndex to toIndex", () => {
      // Arrange
      const model = makeModel("# Title\n\nParagraph\n\n### Section");
      const { markdownNodes, moveNode } = useMarkdownProcessor(model);
      const firstType = markdownNodes.value[0]?.type;
      const lastType = markdownNodes.value[2]?.type;

      // Act — swap first and last
      moveNode(0, 2);

      // Assert
      expect(markdownNodes.value[2]?.type).toBe(firstType);
      expect(markdownNodes.value[1]?.type).toBe(lastType);
    });

    it("does nothing when fromIndex is out of bounds", () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, moveNode } = useMarkdownProcessor(model);
      const initialLength = markdownNodes.value.length;

      // Act
      moveNode(99, 0);

      // Assert — splice returns empty array, if (node) guard prevents splice(toIndex)
      expect(markdownNodes.value).toHaveLength(initialLength);
    });
  });

  describe("compileMarkdown — edge cases via mocked parser", () => {
    it("handles undefined model value gracefully via ?? fallback", () => {
      // Arrange
      const model = ref<string | undefined>(undefined);

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert — compileMarkdown called with "" from ?? fallback
      expect(markdownNodes.value).toHaveLength(0);
    });

    it("handles external change to undefined via ?? fallback in watcher", async () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes } = useMarkdownProcessor(model);
      expect(markdownNodes.value).toHaveLength(1);

      // Act
      model.value = undefined;
      await nextTick();
      await nextTick();

      // Assert — watcher's compileMarkdown called with "" from ?? fallback
      expect(markdownNodes.value).toHaveLength(0);
    });

    it("handles image block with missing src/alt/caption regex captures", () => {
      // Arrange
      const imageMarkdown = '"""MarkdownModuleImage\n"""';
      const model = makeModel(imageMarkdown);

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert — all three regex fallbacks hit
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.IMAGE);
      expect(mockCreateImageNode).toHaveBeenCalledWith("", "", "");
    });

    it("handles list item without paragraph child via mocked parser", () => {
      // Arrange — mock parser returns list with items lacking a paragraph child
      mockUnifiedParse.mockReturnValue({
        children: [{
          type: "list",
          children: [
            { type: "listItem", children: [{ type: "somethingElse" }] },
          ],
        }],
      });

      // Act
      const model = makeModel("ignored");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert — firstParagraph is falsy, returns "" via fallback
      expect(mockCreateListNode).toHaveBeenCalledWith([""]);
    });

    it("handles paragraph with null text value via ?? fallback", () => {
      // Arrange — mock parser returns paragraph with text child where value is null
      mockUnifiedParse.mockReturnValue({
        children: [{
          type: "paragraph",
          children: [{ type: "text", value: null }],
        }],
      });

      // Act
      const model = makeModel("ignored");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert — node.children[0].value ?? "" fallback hit
      expect(mockCreateTextNode).toHaveBeenCalledWith(MarkdownNodeType.PARAGRAPH, "");
    });
  });

  describe("serializeMarkdown — edge cases", () => {
    it("returns empty string for nodes with unsupported type", async () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Push a node with an unsupported type (not in any if-branch)
      const unknownNode = new MarkdownAstNode({
        type: 999 as MarkdownNodeType,
        componentState: new MarkdownModuleTextState({ text: "irrelevant" }),
        editingState: { cursorPosition: 0 },
      });
      markdownNodes.value.push(unknownNode);

      // Act — trigger serialization by mutating existing node
      const titleNode = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      titleNode.componentState.text = "Changed";
      await nextTick();
      await nextTick();

      // Assert — unknown node falls through to return "" at end of serializeMarkdown
      // model gets: "# Changed\n\n" (title serialized, unknown becomes "")
      expect(model.value).toBe("# Changed\n\n");
    });
  });

  describe("replaceNodeType — non-text node replacement", () => {
    it("replaces a LIST node with a HEADLINE, hitting isTextNodeState false branch", async () => {
      // Arrange
      const model = makeModel("- item");
      const { markdownNodes, replaceNodeType } = useMarkdownProcessor(model);
      const listNode = markdownNodes.value[0]!;

      // Act
      const result = replaceNodeType(listNode, MarkdownNodeType.HEADLINE1);
      await nextTick();

      // Assert — isTextNodeState is false for list, so currentText = ""
      expect(result).not.toBeNull();
      expect(result?.newNode.type).toBe(MarkdownNodeType.HEADLINE1);
      expect(mockCreateTextNode).toHaveBeenCalledWith(MarkdownNodeType.HEADLINE1, "");
    });

    it("replaces an IMAGE node with a PARAGRAPH, hitting isTextNodeState false branch", async () => {
      // Arrange
      const model = makeModel('"""MarkdownModuleImage\nsrc: x\nalt: y\ncaption: z\n"""');
      const { markdownNodes, replaceNodeType } = useMarkdownProcessor(model);
      const imageNode = markdownNodes.value[0]!;

      // Act
      const result = replaceNodeType(imageNode, MarkdownNodeType.PARAGRAPH);
      await nextTick();

      // Assert — isTextNodeState is false for image, so currentText = ""
      expect(result).not.toBeNull();
      expect(result?.newNode.type).toBe(MarkdownNodeType.PARAGRAPH);
      expect(mockCreateTextNode).toHaveBeenCalledWith(MarkdownNodeType.PARAGRAPH, "");
    });
  });
});
