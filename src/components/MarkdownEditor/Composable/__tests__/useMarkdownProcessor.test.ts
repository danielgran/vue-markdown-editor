import { nextTick, ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkdownAstNode } from "../../Types/MarkdownAstNode";
import MarkdownNodeType from "../../Types/MarkdownAstNodeType";
import MarkdownModuleTextState from "../../Modules/MarkdownModuleTextState";
import MarkdownModuleImageState from "../../Modules/MarkdownModuleImageState";

// --- Hoist mock functions so they are available when vi.mock factory runs ---
const { mockCreateTextNode, mockCreateImageNode, mockCreateBlankParagraph } = vi.hoisted(() => ({
  mockCreateTextNode: vi.fn(),
  mockCreateImageNode: vi.fn(),
  mockCreateBlankParagraph: vi.fn(),
}));

// --- Mock MarkdownNodeFactory (second-layer dep) ---
vi.mock("../../Factory/MarkdownNodeFactory", () => ({
  default: {
    createTextNode: mockCreateTextNode,
    createImageNode: mockCreateImageNode,
    createBlankParagraph: mockCreateBlankParagraph,
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

// Import SUT after mocks
import useMarkdownProcessor from "../useMarkdownProcessor";

describe("useMarkdownProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTextNode.mockImplementation((type: MarkdownNodeType, text: string) => makeFakeTextNode(type, text));
    mockCreateImageNode.mockImplementation((src: string, alt: string, caption: string) =>
      makeFakeImageNode(src, alt, caption),
    );
    mockCreateBlankParagraph.mockImplementation(() => makeFakeTextNode(MarkdownNodeType.PARAGRAPH, ""));
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
  });
});
