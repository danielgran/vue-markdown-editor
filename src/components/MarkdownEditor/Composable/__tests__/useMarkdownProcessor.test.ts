import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownAstNode } from "../../Types/MarkdownAstNode";
import MarkdownNodeType from "../../Types/MarkdownAstNodeType";
import MarkdownModuleTextState from "../../Modules/MarkdownModuleTextState";
import MarkdownModuleImageState from "../../Modules/MarkdownModuleImageState";
import MarkdownModuleListState from "../../Modules/MarkdownModuleListState";
import MarkdownModuleFileState from "../../Modules/MarkdownModuleFileState";
import MarkdownModuleCodeBlockState from "../../Modules/MarkdownModuleCodeBlockState";
import MarkdownModuleTableState from "../../Modules/MarkdownModuleTableState";

// --- Hoist mock functions so they are available when vi.mock factory runs ---
const { mockCreateTextNode, mockCreateImageNode, mockCreateBlankParagraph, mockCreateListNode, mockCreateOrderedListNode, mockCreateBlockquoteNode, mockCreateCodeBlockNode, mockCreateHrNode, mockCreateTableNode, mockCreateFileNode, mockUnifiedParse } = vi.hoisted(() => ({
  mockCreateTextNode: vi.fn(),
  mockCreateImageNode: vi.fn(),
  mockCreateBlankParagraph: vi.fn(),
  mockCreateListNode: vi.fn(),
  mockCreateOrderedListNode: vi.fn(),
  mockCreateBlockquoteNode: vi.fn(),
  mockCreateCodeBlockNode: vi.fn(),
  mockCreateHrNode: vi.fn(),
  mockCreateTableNode: vi.fn(),
  mockCreateFileNode: vi.fn(),
  mockUnifiedParse: vi.fn(),
}));

// --- Mock unified (second-layer dep) — defaults to real parser ---
vi.mock("unified", () => {
  const mockProcessor = {
    use: () => mockProcessor,
    parse: mockUnifiedParse,
  };
  return {
    unified: () => mockProcessor,
  };
});

// --- Mock MarkdownNodeFactory (second-layer dep) ---
vi.mock("../../Factory/MarkdownNodeFactory", () => ({
  default: {
    createTextNode: mockCreateTextNode,
    createImageNode: mockCreateImageNode,
    createBlankParagraph: mockCreateBlankParagraph,
    createListNode: mockCreateListNode,
    createOrderedListNode: mockCreateOrderedListNode,
    createBlockquoteNode: mockCreateBlockquoteNode,
    createCodeBlockNode: mockCreateCodeBlockNode,
    createHrNode: mockCreateHrNode,
    createTableNode: mockCreateTableNode,
    createFileNode: mockCreateFileNode,
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

const makeFakeListNode = (items: string[], type: MarkdownNodeType = MarkdownNodeType.LIST): MarkdownAstNode<MarkdownModuleListState> =>
  new MarkdownAstNode({
    type,
    componentState: new MarkdownModuleListState({
      items: items.map(text => new MarkdownModuleTextState({ text })),
    }),
    editingState: { cursorPosition: 0 },
  });

const makeFakeCodeBlockNode = (code: string, language: string): MarkdownAstNode<MarkdownModuleCodeBlockState> =>
  new MarkdownAstNode({
    type: MarkdownNodeType.CODE_BLOCK,
    componentState: new MarkdownModuleCodeBlockState({ code, language }),
    editingState: { cursorPosition: 0 },
  });

const makeFakeTableNode = (headers: string[], rows: string[][]): MarkdownAstNode<MarkdownModuleTableState> =>
  new MarkdownAstNode({
    type: MarkdownNodeType.TABLE,
    componentState: new MarkdownModuleTableState({ headers, rows }),
    editingState: { cursorPosition: 0 },
  });

const makeFakeFileNode = (url: string, fileName: string, fileSize: number, mimeType: string, uploadError = ""): MarkdownAstNode<MarkdownModuleFileState> =>
  new MarkdownAstNode({
    type: MarkdownNodeType.FILE,
    componentState: new MarkdownModuleFileState({ url, fileName, fileSize, mimeType, uploadError }),
    editingState: { cursorPosition: 0 },
  });

// Import SUT after mocks
import useMarkdownProcessor from "../useMarkdownProcessor";

describe("useMarkdownProcessor", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: unified mock passes through to the real remark-parse + remark-gfm
    // parser — matching the real pipeline used by parseMarkdown (remark-gfm adds
    // GFM tables and auto-links bare URLs, which the parser must handle).
    const actualUnified = await vi.importActual<any>("unified");
    const actualRemarkParse = await vi.importActual<any>("remark-parse");
    const actualRemarkGfm = await vi.importActual<any>("remark-gfm");
    const remarkGfmPlugin = actualRemarkGfm.default ?? actualRemarkGfm;
    mockUnifiedParse.mockImplementation((input: string) => {
      return actualUnified.unified().use(actualRemarkParse.default).use(remarkGfmPlugin).parse(input);
    });

    mockCreateTextNode.mockImplementation((type: MarkdownNodeType, text: string) => makeFakeTextNode(type, text));
    mockCreateImageNode.mockImplementation((src: string, alt: string, caption: string) =>
      makeFakeImageNode(src, alt, caption),
    );
    mockCreateBlankParagraph.mockImplementation(() => makeFakeTextNode(MarkdownNodeType.PARAGRAPH, ""));
    mockCreateListNode.mockImplementation((items: string[]) => makeFakeListNode(items));
    mockCreateOrderedListNode.mockImplementation((items: string[]) =>
      makeFakeListNode(items, MarkdownNodeType.ORDERED_LIST),
    );
    mockCreateBlockquoteNode.mockImplementation((text: string) => makeFakeTextNode(MarkdownNodeType.BLOCKQUOTE, text));
    mockCreateCodeBlockNode.mockImplementation((code: string, language: string) =>
      makeFakeCodeBlockNode(code, language),
    );
    mockCreateHrNode.mockImplementation(() =>
      new MarkdownAstNode({
        type: MarkdownNodeType.HR,
        componentState: {},
        editingState: { cursorPosition: 0 },
      }),
    );
    mockCreateTableNode.mockImplementation((headers: string[], rows: string[][]) =>
      makeFakeTableNode(headers, rows),
    );
    mockCreateFileNode.mockImplementation((url: string, fileName: string, fileSize: number, mimeType: string, uploadError = "") =>
      makeFakeFileNode(url, fileName, fileSize, mimeType, uploadError),
    );
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

    it("parses the custom file block syntax into a FILE node", () => {
      // Arrange
      const fileMarkdown = '"""MarkdownModuleFile\nurl: https://example.com/doc.pdf\nfileName: report.pdf\nfileSize: 1024\nmimeType: application/pdf\n"""';
      const model = makeModel(fileMarkdown);

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.FILE);
      expect(mockCreateFileNode).toHaveBeenCalledWith("https://example.com/doc.pdf", "report.pdf", 1024, "application/pdf");
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

  describe("compileMarkdown — new module parsing", () => {
    it("parses a blockquote into a BLOCKQUOTE node", () => {
      // Arrange
      const model = makeModel("> A great quote");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.BLOCKQUOTE);
      expect(mockCreateBlockquoteNode).toHaveBeenCalledWith("A great quote");
    });

    it("parses a fenced code block into a CODE_BLOCK node", () => {
      // Arrange
      const model = makeModel("```ts\nconst x = 1;\n```");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.CODE_BLOCK);
      expect(mockCreateCodeBlockNode).toHaveBeenCalledWith("const x = 1;", "ts");
    });

    it("parses a thematic break into an HR node", () => {
      // Arrange
      const model = makeModel("---");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.HR);
      expect(mockCreateHrNode).toHaveBeenCalled();
    });

    it("parses an ordered list into an ORDERED_LIST node", () => {
      // Arrange
      const model = makeModel("1. First\n2. Second");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.ORDERED_LIST);
      expect(mockCreateOrderedListNode).toHaveBeenCalledWith(["First", "Second"]);
    });

    it("parses a GFM table into a TABLE node", () => {
      // Arrange
      const model = makeModel("| Name | Role |\n| --- | --- |\n| Alice | Admin |");

      // Act
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert
      expect(markdownNodes.value).toHaveLength(1);
      expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.TABLE);
      expect(mockCreateTableNode).toHaveBeenCalledWith(["Name", "Role"], [["Alice", "Admin"]]);
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

    it("serializes a FILE node with custom block syntax", async () => {
      // Arrange
      const fileMarkdown = '"""MarkdownModuleFile\nurl: https://example.com/doc.pdf\nfileName: report.pdf\nfileSize: 1024\nmimeType: application/pdf\n"""';
      const model = makeModel(fileMarkdown);
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate the file state
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleFileState>;
      node.componentState.url = "https://example.com/new.pdf";
      node.componentState.fileName = "updated.pdf";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toContain('"""MarkdownModuleFile');
      expect(model.value).toContain("url: https://example.com/new.pdf");
      expect(model.value).toContain("fileName: updated.pdf");
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


  describe("addNodeWithType", () => {
    it("inserts a FILE node with JSON-encoded metadata", async () => {
      // Arrange
      const model = makeModel("# Title");
      const { markdownNodes, addNodeWithType } = useMarkdownProcessor(model);

      // Act
      const fileData = JSON.stringify({
        url: "",
        fileName: "test.pdf",
        fileSize: 2048,
        mimeType: "application/pdf",
        uploadError: "",
      });
      const newIndex = addNodeWithType(0, MarkdownNodeType.FILE, fileData);
      await nextTick();

      // Assert
      expect(markdownNodes.value).toHaveLength(2);
      expect(markdownNodes.value[1]?.type).toBe(MarkdownNodeType.FILE);
      expect(newIndex).toBe(1);
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

  describe("serializeMarkdown — new modules", () => {
    it("serializes a BLOCKQUOTE node by prefixing every line with '> '", async () => {
      // Arrange
      const model = makeModel("> Old quote");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate the quote text to trigger serialization
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      node.componentState.text = "New quote\ncontinued";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("> New quote\n> continued");
    });

    it("serializes a CODE_BLOCK node with a fenced code block and language", async () => {
      // Arrange
      const model = makeModel("```ts\nconst x = 1;\n```");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate the code to trigger serialization
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleCodeBlockState>;
      node.componentState.code = "const y = 2;";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("```ts\nconst y = 2;\n```");
    });

    it("serializes an HR node to '---'", async () => {
      // Arrange — an HR between two paragraphs
      const model = makeModel("Intro\n\n---\n\nOutro");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate the first paragraph to trigger serialization
      const node = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTextState>;
      node.componentState.text = "Intro!";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("Intro!\n\n---\n\nOutro");
    });

    it("serializes an ORDERED_LIST node with numbered items", async () => {
      // Arrange
      const model = makeModel("1. a\n2. b");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate the first item to trigger serialization
      const listNode = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleListState>;
      listNode.componentState.items[0]!.text = "x";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("1. x\n2. b");
    });

    it("serializes a TABLE node as a GFM pipe table", async () => {
      // Arrange
      const model = makeModel("| Name | Role |\n| --- | --- |\n| Alice | Admin |");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Act — mutate a cell to trigger serialization
      const tableNode = markdownNodes.value[0] as MarkdownAstNode<MarkdownModuleTableState>;
      tableNode.componentState.rows[0]![0] = "Bob";
      await nextTick();
      await nextTick();

      // Assert
      expect(model.value).toBe("| Name | Role |\n| --- | --- |\n| Bob | Admin |");
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

    it("handles paragraph with undefined text value via ?? fallback", () => {
      // Arrange — mock parser returns paragraph with text child where value is undefined
      mockUnifiedParse.mockReturnValue({
        children: [{
          type: "paragraph",
          children: [{ type: "text", value: undefined }],
        }],
      });

      // Act
      const model = makeModel("ignored");
      const { markdownNodes } = useMarkdownProcessor(model);

      // Assert — node.children[0].value ?? "" fallback hit, phrasingContentToText sees "undefined"
      expect(mockCreateTextNode).toHaveBeenCalledWith(MarkdownNodeType.PARAGRAPH, "undefined");
    });

    it("handles triple-quote block where split returns empty array", () => {
      // Arrange — monkey-patch String.split so that a triple-quoted marker
      // returns an empty array, hitting the (text.split("\n")[0] ?? "") branch
      const originalSplit = String.prototype.split;
      const splitStub = function (this: string, separator: any, limit?: any): string[] {
        if (this.startsWith('"""SPLIT_EMPTY')) return [];
        return originalSplit.call(this, separator, limit) as string[];
      };
      String.prototype.split = splitStub;

      try {
        const model = makeModel('"""SPLIT_EMPTY\nsome: value\n"""');

        // Act
        const { markdownNodes } = useMarkdownProcessor(model);

        // Assert — moduleName from split fallback is ""; falls through to regular text
        expect(markdownNodes.value).toHaveLength(1);
        expect(markdownNodes.value[0]?.type).toBe(MarkdownNodeType.PARAGRAPH);
      } finally {
        String.prototype.split = originalSplit;
      }
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
