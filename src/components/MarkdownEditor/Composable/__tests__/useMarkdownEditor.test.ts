import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MarkdownAstNode } from "../../Types/MarkdownAstNode";
import MarkdownNodeType from "../../Types/MarkdownAstNodeType";

// --- Mock useMarkdownProcessor (second-layer dep) ---
const mockDeleteNode = vi.fn();
const mockAddBlankNode = vi.fn();
const mockReplaceNodeType = vi.fn();
const mockMoveNode = vi.fn();
const mockMarkdownNodes = ref<MarkdownAstNode[]>([]);

vi.mock("../useMarkdownProcessor", () => ({
  default: vi.fn(() => ({
    markdownNodes: mockMarkdownNodes,
    deleteNode: mockDeleteNode,
    addBlankNode: mockAddBlankNode,
    replaceNodeType: mockReplaceNodeType,
    moveNode: mockMoveNode,
  })),
}));

// Import SUT after mocks are set up
import { useMarkdownEditor } from "../useMarkdownEditor";
import useMarkdownProcessor from "../useMarkdownProcessor";

describe("useMarkdownEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes markdownContent with the provided initial string", () => {
      // Arrange
      const initialContent = "# Hello";

      // Act
      const { markdownContent } = useMarkdownEditor(initialContent);

      // Assert
      expect(markdownContent.value).toBe(initialContent);
    });

    it("initializes markdownContent with empty string when no argument is provided", () => {
      // Arrange / Act
      const { markdownContent } = useMarkdownEditor();

      // Assert
      expect(markdownContent.value).toBe("");
    });

    it("passes markdownContent as ModelRef to useMarkdownProcessor", () => {
      // Arrange / Act
      useMarkdownEditor("initial content");

      // Assert
      expect(useMarkdownProcessor).toHaveBeenCalledOnce();
      const passedArg = vi.mocked(useMarkdownProcessor).mock.calls[0]?.[0];
      expect(passedArg?.value).toBe("initial content");
    });
  });

  describe("returned interface", () => {
    it("returns markdownContent as a reactive ref", () => {
      // Arrange / Act
      const { markdownContent } = useMarkdownEditor("test");

      // Assert
      expect(markdownContent).toHaveProperty("value");
    });

    it("returns markdownNodes from useMarkdownProcessor", () => {
      // Arrange / Act
      const { markdownNodes } = useMarkdownEditor("test");

      // Assert
      expect(markdownNodes).toBe(mockMarkdownNodes);
    });

    it("returns deleteNode from useMarkdownProcessor", () => {
      // Arrange / Act
      const { deleteNode } = useMarkdownEditor("test");

      // Assert
      expect(deleteNode).toBe(mockDeleteNode);
    });

    it("returns addBlankNode from useMarkdownProcessor", () => {
      // Arrange / Act
      const { addBlankNode } = useMarkdownEditor("test");

      // Assert
      expect(addBlankNode).toBe(mockAddBlankNode);
    });

    it("returns replaceNodeType from useMarkdownProcessor", () => {
      // Arrange / Act
      const { replaceNodeType } = useMarkdownEditor("test");

      // Assert
      expect(replaceNodeType).toBe(mockReplaceNodeType);
    });

    it("returns moveNode from useMarkdownProcessor", () => {
      // Arrange / Act
      const { moveNode } = useMarkdownEditor("test");

      // Assert
      expect(moveNode).toBe(mockMoveNode);
    });
  });

  describe("MarkdownEditorInstance type", () => {
    it("returns all required keys of the MarkdownEditorInstance interface", () => {
      // Arrange
      const expectedKeys: Array<keyof ReturnType<typeof useMarkdownEditor>> = [
        "markdownContent",
        "markdownNodes",
        "deleteNode",
        "addBlankNode",
        "replaceNodeType",
        "moveNode",
      ];

      // Act
      const instance = useMarkdownEditor();

      // Assert
      for (const key of expectedKeys) {
        expect(instance).toHaveProperty(key);
      }
    });
  });
});
